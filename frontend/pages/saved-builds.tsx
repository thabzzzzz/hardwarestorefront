import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import Header from "../components/header/header";
import styles from "../styles/home.module.css";
import { useAuth } from "../hooks/useAuth";

const API_BASE =
    typeof window === "undefined"
        ? process.env.SERVER_API_BASE_URL || "http://web"
        : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export default function SavedBuilds() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [builds, setBuilds] = useState<any[]>([]);
    const [isLoadingBuilds, setIsLoadingBuilds] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchBuilds = async () => {
            const token = localStorage.getItem("auth_token");
            if (!token) return;

            try {
                const res = await fetch(`${API_BASE}/api/pc-builds`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setBuilds(data.data || []);
                }
            } catch (e) {
                console.error("Failed to fetch builds", e);
            } finally {
                setIsLoadingBuilds(false);
            }
        };

        if (user) {
            fetchBuilds();
        }
    }, [user]);

    const deleteBuild = async (id: number) => {
        if (!confirm("Are you sure you want to delete this build?")) return;
        const token = localStorage.getItem("auth_token");
        try {
            const res = await fetch(`${API_BASE}/api/pc-builds/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                setBuilds((prev) => prev.filter((b) => b.id !== id));
            } else {
                alert("Failed to delete build");
            }
        } catch (e) {
            console.error("Failed to delete", e);
        }
    };

    if (loading) {
        return (
            <div className={styles.appContainer}>
                <Header />
                <main className={styles.main}>
                    <div className={styles.container} style={{ marginTop: "2rem" }}>
                        <p>Loading...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className={styles.appContainer}>
            <Head>
                <title>Saved Builds | WiredWorkshop</title>
            </Head>

            <Header />

            <main className={styles.main}>
                <div
                    className={styles.container}
                    style={{ marginTop: "2rem", minHeight: "50vh" }}
                >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h1 style={{ fontSize: "28px", color: "#111" }}>
                            My Saved Builds
                        </h1>
                        <Link href="/pc-builder" style={{ padding: "8px 16px", backgroundColor: "#1f7a8c", color: "white", borderRadius: "8px", textDecoration: "none", fontWeight: 600 }}>Create New Build</Link>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {isLoadingBuilds ? (
                            <p>Loading builds...</p>
                        ) : builds.length === 0 ? (
                            <p style={{ color: "#666" }}>You don't have any saved builds yet.</p>
                        ) : (
                            builds.map((build) => (
                                <div
                                    key={build.id}
                                    style={{
                                        background: "#fff",
                                        border: "1px solid #eee",
                                        borderRadius: "8px",
                                        padding: "20px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                                    }}
                                >
                                    <div>
                                        <h3 style={{ margin: "0 0 8px 0", fontSize: "20px", color: "#222" }}>
                                            {build.name}
                                        </h3>
                                        <div style={{ color: "#666", fontSize: "14px", display: "flex", gap: "16px" }}>
                                            <span>{build.components_count} components</span>
                                            <span>Last updated: {new Date(build.updated_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <Link
                                            href={`/pc-builder?build_id=${build.share_token}`}
                                            style={{
                                                padding: "8px 16px",
                                                background: "#f4f4f6",
                                                color: "#1f7a8c",
                                                borderRadius: "6px",
                                                textDecoration: "none",
                                                fontWeight: 500,
                                            }}
                                        >
                                            Edit Build
                                        </Link>
                                        <button
                                            onClick={() => deleteBuild(build.id)}
                                            style={{
                                                padding: "8px 16px",
                                                background: "#fff",
                                                color: "#d93025",
                                                border: "1px solid #d93025",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                fontWeight: 500,
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
