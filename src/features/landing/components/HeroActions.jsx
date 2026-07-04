import { Link } from "react-router-dom";
import { ArrowRight, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HeroActions() {
  return (
    <div className="mt-10 flex flex-wrap gap-4">
      {/* Explore Shops Button */}
      <Button asChild className="px-8 py-6 text-base">
        <Link to="/shops">
          Explore Shops
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </Button>

      {/* Watch Demo Button */}
      <Button
        variant="outline"
        className="px-8 py-6 text-base"
      >
        <PlayCircle className="mr-2 h-5 w-5" />
        Watch Demo
      </Button>
    </div>
  );
}