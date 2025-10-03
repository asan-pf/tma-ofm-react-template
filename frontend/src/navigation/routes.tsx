import type { ComponentType, JSX } from "react";
import { MapPin, User } from "lucide-react";

import { MapPage } from "@/pages/MapPage";
import { ProfilePage } from "@/pages/ProfilePage";

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  {
    path: "/",
    Component: MapPage,
    title: "Map",
    icon: <MapPin className="w-6 h-6" />,
  },
  {
    path: "/profile",
    Component: ProfilePage,
    title: "Profile",
    icon: <User className="w-6 h-6" />,
  },
];
