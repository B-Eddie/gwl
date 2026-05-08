"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase";
import Calendar from "react-calendar";
import AdminAttendanceTable from "@/components/AdminAttendanceTable";
import type { TileArgs } from "react-calendar";
import "react-calendar/dist/Calendar.css";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [signedInDays, setSignedInDays] = useState<Set<string>>(new Set());
  const [signedInToday, setSignedInToday] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [getName, setName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  useEffect(() => {
    // check if user already signed in
    async function checkIfSignedInToday() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setSignedInToday(false);
        return;
      }

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", toDateKey(new Date()))
        .maybeSingle();
      if (attendanceError) {
        setSignedInToday(false);
        return;
      }

      setSignedInToday(Boolean(attendanceData));
    }

    // load attendance data
    async function loadAttendance() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;

      const storageKey = `attendance:${user.id}`;
      const stored = globalThis.localStorage.getItem(storageKey);
      const parsed = stored ? (JSON.parse(stored) as string[]) : [];
      const nextDays = new Set(parsed);

      if (user.last_sign_in_at) {
        nextDays.add(toDateKey(new Date(user.last_sign_in_at)));
      }

      // Record this session's sign-in day for a simple local attendance history.
      nextDays.add(toDateKey(new Date()));

      const nextArray = Array.from(nextDays).sort();
      globalThis.localStorage.setItem(storageKey, JSON.stringify(nextArray));
      setSignedInDays(new Set(nextArray));
    }

    async function loadName() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;
      setName(user.user_metadata.display_name ?? null);
    }

    async function checkAdmin() {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user?.email) return;
      if (user.email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "")) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    }

    void checkAdmin();
    void loadName();
    void loadAttendance();
    if (!isAdmin) {
      void checkIfSignedInToday();
    }
  }, [supabase]);

  function tileClassName({ date, view }: TileArgs): string | undefined {
    if (view !== "month") return undefined;

    const classes: string[] = [];
    const dateKey = toDateKey(date);

    if (toDateKey(new Date()) === dateKey) {
      classes.push("attendance-today");
    }

    if (signedInDays.has(dateKey)) {
      classes.push("attendance-signed");
    }

    return classes.length ? classes.join(" ") : undefined;
  }

  async function handleSignInToday(e: React.SubmitEvent) {
    e.preventDefault();
    setIsLoading(true);
    setBannerMessage(null);
    setShowBanner(false);

    try {
      // 1. Get the position
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            maximumAge: 0,
          });
        },
      );

      const { latitude, longitude } = position.coords;
      console.log(`User is at: ${latitude}, ${longitude}`);
      // south campus
      const bottomLeft = {
        lat: 43.461952,
        lng: -79.703682,
      };

      const topRight = {
        lat: 43.464604,
        lng: -79.70084,
      };

      // north campus
      const secondCampusBottomLeft = {
        lat: 43.463347,
        lng: -79.70595,
      };
      const secondCampusTopRight = {
        lat: 43.464596,
        lng: -79.704091,
      };

      if (
        (latitude >= bottomLeft.lat &&
          latitude <= topRight.lat &&
          longitude >= bottomLeft.lng &&
          longitude <= topRight.lng) ||
        (latitude >= secondCampusBottomLeft.lat &&
          latitude <= secondCampusTopRight.lat &&
          longitude >= secondCampusBottomLeft.lng &&
          longitude <= secondCampusTopRight.lng)
      ) {
        const todayKey = toDateKey(new Date());
        setSignedInDays((prev) => new Set([...prev, todayKey]));

        const { data } = await supabase.auth.getSession();
        const user = data.session?.user;
        if (!user) return;

        // check if user has already signed in today
        const { data: existingAttendance } = await supabase
          .from("attendance")
          .select("*")
          .eq("attempted_email", user.email)
          .eq("date", todayKey)
          .maybeSingle();

        if (existingAttendance) {
          setBannerMessage(
            "Error: You have already signed in today. Please try again tomorrow.",
          );
          setShowBanner(true);
          return;
        }

        // insert attendance data into database
        await supabase.from("attendance").insert({
          user_id: user.id,
          date: todayKey,
          attempted_email: user.email,
        });

        setSignedInToday(true);
        setBannerMessage("Signed in successfully.");
        setShowBanner(true);
      } else {
        setBannerMessage(
          "Error: You are not in the school area. Please try again.",
        );
        setShowBanner(true);
      }
    } catch (err) {
      console.error("Error getting location:", err);
      const message =
        "Error: Could not get your location. Please enable GPS and try again.";
      setBannerMessage(message);
      setShowBanner(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    // !! add styling later
    <div className="">
      <h1 className="text-2xl font-bold text-ink">Welcome {getName}</h1>
      <div>
        {/* show if signed in */}
        {!isAdmin && signedInToday !== null && (
          <h2 className="mt-4 text-lg font-bold text-ink">Attendance</h2>
        )}
        {/* banner messages */}
        {showBanner && bannerMessage && (
          <div
            className={`mt-2 rounded-lg border px-3 py-2 text-sm ${
              bannerMessage.startsWith("Error:")
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {bannerMessage}
          </div>
        )}

        {/* if user signed in today */}
        {signedInToday && signedInToday !== null && (
          <p className="mt-2 text-sm text-ink-muted">Signed in today.</p>
        )}

        {/* if user did not sign in today */}
        {!signedInToday && !isAdmin && signedInToday !== null && (
          <form onSubmit={handleSignInToday}>
            <button
              type="submit"
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover mt-2"
            >
              Sign in today
            </button>
          </form>
        )}

        {/* attendance calendar */}
        {!isAdmin && signedInToday !== null && (
          <Calendar
            className="attendance-calendar"
            tileClassName={tileClassName}
          />
        )}

        {/* admin dashboard */}
        {isAdmin && <AdminAttendanceTable />}
      </div>
    </div>
  );
}
