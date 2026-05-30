"use client";

import { useDeferredValue, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  activityCategories,
  activityWindows,
  type Activity,
  type ActivityFilters,
} from "@/lib/arkiv-client/activity";

type ActivityShellProps = {
  filters: ActivityFilters;
  initialActivities: Activity[];
  writerConfigured: boolean;
  projectAttribute: string;
  trustedCreatorAddress: string | null;
};

type SubmitState = {
  tone: "idle" | "success" | "error";
  message: string;
};

const emptyState: SubmitState = {
  tone: "idle",
  message: "",
};

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat("es-ES", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export function ActivityShell({
  filters,
  initialActivities,
  writerConfigured,
  projectAttribute,
  trustedCreatorAddress,
}: ActivityShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [submitState, setSubmitState] = useState<SubmitState>(emptyState);
  const [isPending, startTransition] = useTransition();
  const deferredActivities = useDeferredValue(initialActivities);

  function updateFilters(next: Partial<Pick<ActivityFilters, "category" | "window">>) {
    const params = new URLSearchParams(searchParams.toString());
    const category = next.category ?? filters.category;
    const window = next.window ?? filters.window;

    if (category === "all") {
      params.delete("category");
    } else {
      params.set("category", category);
    }

    params.set("window", window);

    startTransition(() => {
      router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, {
        scroll: false,
      });
    });
  }

  async function handleSubmit(formData: FormData) {
    setSubmitState(emptyState);

    const response = await fetch("/api/activities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        authorLabel: formData.get("authorLabel"),
        category: formData.get("category"),
        text: formData.get("text"),
        link: formData.get("link"),
      }),
    });

    const payload = (await response.json()) as { error?: string };

    if (!response.ok) {
      setSubmitState({
        tone: "error",
        message: payload.error ?? "No se pudo publicar la actividad.",
      });
      return;
    }

    setSubmitState({
      tone: "success",
      message: "Actividad enviada a Arkiv Braga.",
    });

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="shell-grid">
      <section className="panel hero-panel">
        <div className="eyebrow">Arkiv activity mesh</div>
        <h1>Un feed efimero para publicar actividad confiable en Arkiv.</h1>
        <p className="hero-copy">
          Esta primera entrega separa lecturas publicas de escrituras seguras, filtra por
          atributo de proyecto y, cuando hay `PRIVATE_KEY`, restringe la lectura al creador
          confiable.
        </p>
        <div className="hero-metrics">
          <div>
            <span className="metric-label">Project attribute</span>
            <strong>{projectAttribute}</strong>
          </div>
          <div>
            <span className="metric-label">Writer status</span>
            <strong>{writerConfigured ? "Enabled" : "Read-only"}</strong>
          </div>
          <div>
            <span className="metric-label">Trusted creator</span>
            <strong>{trustedCreatorAddress ?? "Pending PRIVATE_KEY"}</strong>
          </div>
        </div>
      </section>

      <section className="panel composer-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Publish</span>
            <h2>Emit a 24-hour activity burst</h2>
          </div>
          <span className={`badge ${writerConfigured ? "badge-live" : "badge-muted"}`}>
            {writerConfigured ? "Writes live" : "Writer disabled"}
          </span>
        </div>

        <form
          className="composer-form"
          action={async (formData) => {
            await handleSubmit(formData);
          }}
        >
          <label>
            <span>Author label</span>
            <input name="authorLabel" maxLength={32} placeholder="Braga Desk" required />
          </label>

          <label>
            <span>Category</span>
            <select name="category" defaultValue="dispatch">
              <option value="dispatch">dispatch</option>
              <option value="signal">signal</option>
              <option value="launch">launch</option>
              <option value="build">build</option>
            </select>
          </label>

          <label>
            <span>Activity copy</span>
            <textarea
              name="text"
              minLength={8}
              maxLength={280}
              rows={5}
              placeholder="Shipping the first trusted Arkiv feed endpoint."
              required
            />
          </label>

          <label>
            <span>Reference link</span>
            <input name="link" placeholder="https://example.com/context" type="url" />
          </label>

          <button disabled={!writerConfigured || isPending} type="submit">
            {isPending ? "Refreshing feed..." : "Publish to Arkiv"}
          </button>
        </form>

        <p className={`form-message form-message-${submitState.tone}`}>{submitState.message}</p>
      </section>

      <section className="panel stream-panel">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Feed</span>
            <h2>Trusted activity stream</h2>
          </div>
          <span className="badge badge-outline">
            {isPending ? "Updating" : `${deferredActivities.length} items`}
          </span>
        </div>

        <div className="filters-bar">
          <label className="filter-control">
            <span>Category</span>
            <select
              onChange={(event) => {
                updateFilters({ category: event.currentTarget.value as ActivityFilters["category"] });
              }}
              value={filters.category}
            >
              <option value="all">all</option>
              {activityCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-control">
            <span>Window</span>
            <select
              onChange={(event) => {
                updateFilters({ window: event.currentTarget.value as ActivityFilters["window"] });
              }}
              value={filters.window}
            >
              {activityWindows.map((window) => (
                <option key={window} value={window}>
                  {window}
                </option>
              ))}
            </select>
          </label>
        </div>

        {deferredActivities.length === 0 ? (
          <div className="empty-state">
            <p>No activity is available yet for this project namespace.</p>
            <p>
              Configure `PRIVATE_KEY`, publish the first entity, and the feed will start reading
              from Braga immediately.
            </p>
          </div>
        ) : (
          <div className="activity-list">
            {deferredActivities.map((activity) => (
              <article className="activity-card" key={activity.arkivEntityKey}>
                <header>
                  <div>
                    <span className="activity-category">{activity.category}</span>
                    <h3>{activity.authorLabel}</h3>
                  </div>
                  <time dateTime={new Date(activity.createdAt).toISOString()}>
                    {formatTime(activity.createdAt)}
                  </time>
                </header>
                <p>{activity.text}</p>
                <footer>
                  <span>
                    {activity.source === "seed" ? "seed preview" : activity.arkivEntityKey.slice(0, 10)}
                    {activity.source === "arkiv" ? "..." : ""}
                  </span>
                  {activity.link ? (
                    <a href={activity.link} rel="noreferrer" target="_blank">
                      Open reference
                    </a>
                  ) : (
                    <span className="muted">24h TTL</span>
                  )}
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}