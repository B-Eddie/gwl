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
import { ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [signedInDays, setSignedInDays] = useState<Set<string>>(new Set());
  const [signedInToday, setSignedInToday] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);
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
      if (!data.session?.user) return;

      try {
        const response = await fetch("/api/attendance");
        if (!response.ok) {
          console.error("Failed to load attendance:", await response.text());
          return;
        }

        const payload = (await response.json()) as { dates?: string[] };
        const dates = (payload.dates ?? []).map((date) => date.slice(0, 10));

        setSignedInDays(new Set(dates));
      } catch (error) {
        console.error("Failed to load attendance:", error);
      }
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
        const { error: insertError } = await supabase
          .from("attendance")
          .insert({
            user_id: user.id,
            date: todayKey,
            attempted_email: user.email,
          });

        if (insertError) {
          setBannerMessage("Error: Could not save sign-in. Please try again.");
          setShowBanner(true);
          return;
        }

        setSignedInDays((prev) => new Set([...prev, todayKey]));
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
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const help = () => {
    window.open("https://example.com", "_blank");
  };

  function getDaysPresent(): number {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + mondayOffset,
    );
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    let count = 0;
    for (const dateKey of signedInDays) {
      const [year, month, day] = dateKey.split("-").map(Number);
      const signedDate = new Date(year, month - 1, day);
      if (signedDate >= weekStart && signedDate <= weekEnd) {
        count++;
      }
    }
    return count;
  }

  return (
    <div className="p-8 bg-[#F9F9FC]">
      {/* signout */}
      <button
        onClick={handleSignOut}
        className="hover:cursor-pointer top-5 right-10 absolute"
      >
        <img
          src="/exit.svg"
          alt="Sign out"
          className="w-5 h-5"
          aria-hidden="true"
        />
      </button>

      <h1 className="text-3xl font-bold text-ink mb-10">Welcome {getName}</h1>
      {/* banner messages */}
      {showBanner && bannerMessage && (
        <div
          className={`mt-2 mb-5 rounded-lg border px-3 py-2 text-sm ${
            bannerMessage.startsWith("Error:")
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {bannerMessage}
        </div>
      )}

      {/* page that only shows when not admin */}
      {!isAdmin && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="order-1 md:col-span-2 md:row-start-1 bg-white border-2 border-[#C2C6D2] p-5 rounded-lg">
            <div className="border-b border-[#E2E2E5]">
              {/* show if signed in */}
              {signedInToday !== null && (
                <h2 className="text-lg font-bold text-ink">Attendance</h2>
              )}
            </div>

            <div className="bg-[#EEEEF0] p-3 mt-3 flex flex-row">
              <div>
                <h1 className="text-ink-muted text-sm font-bold">
                  Current Status
                </h1>
                {/* if user signed in today */}
                {signedInToday && signedInToday !== null ? (
                  <p className="mt-2 text-xl font-bold text-[#003367]">
                    Signed in today.
                  </p>
                ) : signedInToday === false && (
                  <p className="mt-2 text-xl font-bold text-[#003367]">
                    Ready to sign in.
                  </p>
                )}
           
              </div>
              <div className="ml-auto">
                {/* if user did not sign in today */}
                {signedInToday !== null && (
                  <form
                    onSubmit={signedInToday ? undefined : handleSignInToday}
                  >
                    <button
                      type="submit"
                      className={`rounded-lg px-5 py-2.5 text-sm font-semibold mt-2 ${signedInToday ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-accent text-white hover:bg-brand-hover transition-all hover:cursor-pointer"}`}
                      disabled={signedInToday}
                    >
                      Sign in today
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          <div className="order-2 md:col-span-1 md:col-start-3 md:row-start-1">
            <div className="rounded-lg border-2 border-[#C2C6D2] bg-white p-4">
              <h1 className="font-bold text-xl border-b border-[#E2E2E5] pb-2">
                Weekly summary
              </h1>
              <div className="flex flex-row items-center gap-3 mt-2">
                <p className="text-3xl font-bold text-[#003367]">
                  {getDaysPresent()}
                </p>
                <p className="text-sm text-ink-muted">days present this week</p>
              </div>
              {/* add a bar that shows the days present */}
              <div className="mt-4 h-2 w-full rounded-full bg-[#EEEEF0]">
                <div
                  className="h-full rounded-full bg-[#003367] transition-all"
                  style={{
                    width: `${Math.min(getDaysPresent() / 5, 1) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div
            className="order-3 w-full md:col-span-2 md:row-start-2"
            id="student-calendar"
          >
            {!isAdmin && signedInToday !== null && (
              <Calendar
                className="attendance-calendar w-full"
                tileClassName={tileClassName}
                minDetail="month"
                maxDetail="month"
                prev2Label={null}
                next2Label={null}
                prevLabel={<ChevronLeft className="h-5 w-5" strokeWidth={2} />}
                nextLabel={<ChevronRight className="h-5 w-5" strokeWidth={2} />}
                prevAriaLabel="Previous month"
                nextAriaLabel="Next month"
                formatMonthYear={(locale, date) =>
                  date.toLocaleDateString(locale, {
                    month: "long",
                    year: "numeric",
                  })
                }
              />
            )}
          </div>

          <div className="order-4 md:col-span-1 md:col-start-3 md:row-start-2">
            <div className="rounded-lg border-2 border-[#C2C6D2] bg-white p-4">
              <h1 className="font-bold">Need Help?</h1>
              <p className="mt-3">
                If you are experiencing issues with location services, please
                contact administration.
              </p>
              <button
                onClick={help}
                className="bg-accent text-white p-3 rounded-lg mt-5 hover:cursor-pointer hover:bg-[#284978] transition-color"
           
              >
                Contact Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* admin dashboard */}
      {isAdmin && <AdminAttendanceTable />}
    </div>
  );
}
