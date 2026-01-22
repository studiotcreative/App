import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { pagesConfig } from "@/pages.config";

export default function NavigationTracker() {
  const location = useLocation();
  const { user } = useAuth(); // Supabase user from your unified AuthProvider
  const { Pages, mainPage } = pagesConfig;
  const mainPageKey = mainPage ?? Object.keys(Pages)[0];

  useEffect(() => {
    const pathname = location.pathname;
    let pageName;

    if (pathname === "/" || pathname === "") {
      pageName = mainPageKey;
    } else {
      const pathSegment = pathname.replace(/^\//, "").split("/")[0];
      const pageKeys = Object.keys(Pages);
      const matchedKey = pageKeys.find(
        (key) => key.toLowerCase() === pathSegment.toLowerCase()
      );
      pageName = matchedKey || null;
    }

    // Base44 logging removed.
    // If you want activity logs later, we can add a Supabase audit_logs insert
    // once your audit_logs schema allows workspace_id/entity_id to be nullable
    // for navigation events (or add a separate table).
    if (user && pageName) {
      // no-op
    }
  }, [location, user, Pages, mainPageKey]);

  return null;
}
