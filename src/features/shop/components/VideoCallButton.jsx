import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VideoCallButton() {
  return (
    <Button
      className="flex h-16 items-center gap-3 rounded-2xl px-8 text-lg"
    >
      <Video className="h-6 w-6" />

      Start Live Video
    </Button>
  );
}