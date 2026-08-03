import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
    <FileQuestionIcon className="size-8 text-muted-foreground" />
    <div>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist.</p>
    </div>
    <Button nativeButton={false} render={<Link href="/" />}>
      Go home
    </Button>
  </div>
);

export default NotFound;
