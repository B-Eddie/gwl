"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase";
import Skeleton from "react-loading-skeleton";
// stuff for hero section
import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useRef,
  useMemo,
  type FC,
  type ReactNode,
  useState,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { degToRad } from "three/src/math/MathUtils.js";
import { ArrowRight, Star } from "lucide-react";
// ============================================================================
// BUTTON COMPONENT
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "lg";
  children: React.ReactNode;
}

function active(href: string, pathname: string) {
  const p = pathname.replace(/\/$/, "") || "/";
  const h = href.replace(/\/$/, "") || "/";
  return p === h || p.startsWith(h + "/");
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const isHomeRoute = pathname === "/";
  const isProtectedRoute = pathname.startsWith("/dashboard");

  useEffect(() => {
    async function loadAuthState() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const user = session?.user;
      // console.log(Boolean(user));
      setIsAuthenticated(Boolean(user));
    }

    void loadAuthState();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user));
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    // Redirect unauthenticated users only from protected routes.
    if (isAuthenticated === null) return;
    if (!isAuthenticated && isProtectedRoute) {
      let isCancelled = false;

      async function retrySessionThenRedirect() {
        // After signup/login, cookies can lag briefly in client auth state.
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session?.user) {
            if (!isCancelled) {
              setIsAuthenticated(true);
            }
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 250));
        }

        if (!isCancelled) {
          router.push("/auth/login/");
          router.refresh();
        }
      }

      void retrySessionThenRedirect();
      return () => {
        isCancelled = true;
      };
    }
  }, [isAuthenticated, isProtectedRoute, router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (!isHomeRoute) {
    return <>{children}</>;
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-gradient-to-bl from-[#C2C6D2] to-white">
      {/* Hero Content */}
      <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center">
        <div className="px-6 mx-auto max-w-7xl lg:px-8 w-full">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between w-full">
            {/* Left side*/}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              {/* Main Heading */}
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-black sm:text-6xl lg:text-7xl">
                Check into GWL{" "}
                <span className="text-transparent bg-gradient-to-r to-accent from-[#5C6B73] bg-clip-text">
                  quickly and easily
                </span>
              </h1>

              {/* Subtitle */}
              <p className="max-w-3xl mx-auto mb-10 text-lg leading-8 text-black/80 sm:text-xl lg:text-2xl lg:mx-0">
                Sign in quickly, stay organized each day.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <button
                  className="flex font-semibold text-black bg-accent rounded-lg shadow-lg px-8 py-4 text-white hover:cursor-pointer"
                  onClick={() =>
                    router.push(
                      isAuthenticated ? "/dashboard/" : "/auth/register/",
                    )
                  }
                >
                  {isAuthenticated ? "Dashboard" : "Get Started"}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </div>

            {/* Right side */}
            <div className="flex justify-center items-center mb-8 lg:mb-0 lg:w-1/2 relative">
              <img
                src="/school.png"
                alt="Illustration: Checking into GWL"
                className="w-128 h-auto rounded-xl shadow-lg"
                draggable={false}
              />

              <div className="absolute left-0 bottom-0 translate-y-1/2 -translate-x-1/4 flex flex-row items-center justify-center  bg-[#F9F9FCD9] rounded-lg p-4 gap-4">
                <img
                  src="/icon.svg"
                  className="p-2 w-10 bg-light-accent rounded-lg"
                  alt=""
                  width={128}
                  height={128}
                  draggable={false}
                />
                <div className="flex flex-col">
                  <p>Status</p>
                  <p>Location Verified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
