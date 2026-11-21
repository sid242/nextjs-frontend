"use client";

import { useState } from "react";
import { Loader2, MessageSquareHeart, Star } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useSubmitFeedback } from "../queries";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<"GENERAL" | "BUG" | "FEATURE" | "UI">("GENERAL");
  const [comment, setComment] = useState("");

  const submitMutation = useSubmitFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      await submitMutation.mutateAsync({
        rating,
        category,
        comment: comment.trim(),
        metadata: {
          url: typeof window !== "undefined" ? window.location.href : "",
        },
      });
      toast.success("Thank you for your feedback!");
      setComment("");
      setOpen(false);
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs shadow-2xs">
          <MessageSquareHeart className="size-3.5 text-rose-500" />
          Give Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-base">Share Your Feedback</DialogTitle>
            <DialogDescription className="text-xs">
              Tell us what is working well or what we can improve in your workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Overall Experience</Label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`size-5 ${
                        star <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-muted-foreground ml-2 text-xs font-medium">
                  {rating === 5
                    ? "Excellent"
                    : rating === 4
                      ? "Good"
                      : rating === 3
                        ? "Average"
                        : "Needs Improvement"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-category" className="text-xs">
                Category
              </Label>
              <Select
                value={category}
                onValueChange={(val) => setCategory(val as "GENERAL" | "BUG" | "FEATURE" | "UI")}
              >
                <SelectTrigger id="fb-category" className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL" className="text-xs">
                    General Experience
                  </SelectItem>
                  <SelectItem value="FEATURE" className="text-xs">
                    Feature Request
                  </SelectItem>
                  <SelectItem value="UI" className="text-xs">
                    Design & Usability
                  </SelectItem>
                  <SelectItem value="BUG" className="text-xs">
                    Bug Report
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fb-comment" className="text-xs">
                Comments & Ideas
              </Label>
              <Textarea
                id="fb-comment"
                placeholder="What did you like or what could be better?"
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitMutation.isPending || !comment.trim()}
              className="text-xs"
            >
              {submitMutation.isPending && <Loader2 className="mr-1.5 size-3 animate-spin" />}
              Submit Feedback
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
