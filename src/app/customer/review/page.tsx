"use client";

import { Button, Form, Spinner } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { apiFetchDirect } from "@/lib/api";

interface ServiceReviewResponse {
  id: number;
}

function getCustomerId(): number {
  const raw =
    typeof window !== "undefined" ? localStorage.getItem("auth_user") : null;
  if (!raw) return 0;
  return (JSON.parse(raw) as { userId: number }).userId;
}

export default function LeaveReviewPage() {
  const [starRating, setStarRating] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (dto: { StarRating: number; Comment: string }) =>
      apiFetchDirect<ServiceReviewResponse>(
        `/api/ServiceReview?customerId=${getCustomerId()}`,
        { method: "POST", body: JSON.stringify(dto) },
      ),
    onSuccess() {
      setSuccess("Review submitted. Thank you!");
      setStarRating(0);
      setTimeout(() => setSuccess(null), 4000);
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (starRating === 0) return;
    const fd = new FormData(e.currentTarget);
    mutation.mutate({
      StarRating: starRating,
      Comment: fd.get("comment") as string,
    });
    e.currentTarget.reset();
  }

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold mb-6">Leave a Service Review</h2>
      <div className="bg-white border border-gray-300 rounded p-6">
        <Form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">Star Rating</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStarRating(n)}
                  className={`text-2xl leading-none transition-colors ${
                    n <= starRating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            {starRating === 0 && mutation.isError && (
              <p className="text-red-500 text-xs">Please select a rating.</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="comment" className="text-sm font-medium">
              Comment <span className="text-red-400">*</span>
            </label>
            <textarea
              id="comment"
              name="comment"
              required
              rows={4}
              placeholder="Tell us about your experience..."
              className="border border-gray-300 rounded px-3 py-2 text-sm resize-none"
            />
          </div>

          {mutation.isError && (
            <p className="text-red-500 text-sm">
              {(mutation.error as Error).message}
            </p>
          )}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <Button type="submit" isPending={mutation.isPending}>
            {({ isPending }) => (
              <>
                {isPending && <Spinner color="current" size="sm" />}
                {isPending ? "Submitting..." : "Submit Review"}
              </>
            )}
          </Button>
        </Form>
      </div>
    </div>
  );
}
