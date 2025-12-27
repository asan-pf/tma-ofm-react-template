import type { ComponentType, JSX } from "react";
import { MapPin, User } from "lucide-react";

import { HomePage } from "@/pages/HomePage";
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
    Component: HomePage,
    title: "Home",
    icon: <MapPin className="w-6 h-6" />,
  },
  {
    path: "/profile",
    Component: ProfilePage,
    title: "Profile",
    icon: <User className="w-6 h-6" />,
  },
];
