import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Header from "../../components/header/header";
import { BuilderProvider, useBuilder } from "../../context/BuilderContext";
import { BuilderWorkspace } from "../../components/pcbuilder/BuilderWorkspace";
import { toast } from "../../lib/toast";

const API_BASE = typeof window === "undefined"
    ? process.env.SERVER_API_BASE_URL || "http://web"
    : process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function SavedBuildLoader() {
    const router = useRouter();
    const { id } = router.query;
    
    const { 
        setBuildName, 
        setShareToken, 
        setSelectedComponents, 
        setBuildAuthorId,
        setIsLoadingBuild,
        setActiveProfile // Setting an activeProfile mock to give them the budget
    } = useBuilder();

    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!router.isReady || !id) return;

        // Check if we have an unsaved draft from a recent auth redirection for this specific build
        const hasRelevantDraft = () => {
            if (typeof window !== "undefined") {
                const savedDraft = sessionStorage.getItem("builder_draft");
                if (savedDraft) {
                    try {
                        const data = JSON.parse(savedDraft);
                        // If there is a draft, and it matches the ID we are on, and it has modifications, we should preserve it!
                        if (data.shareToken === id && data.isModified) {
                            return true;
                        }
                    } catch (e) {}
                }
            }
            return false;
        };

        async function fetchSavedBuild() {
            if (hasRelevantDraft()) {
                console.log("Restoring unsaved modifications from draft instead of fetching original!");
                return; // Let the BuilderContext handle hydrating the draft!
            }

            setIsLoadingBuild(true);
            try {
                const res = await fetch(`${API_BASE}/api/pc-builds/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    
                    setBuildName(data.name || "Untitled Build");
                    setShareToken(data.share_token);
                    
                    // Transform the saved component variants into the active builder dictionary map
                    let transformed: Record<string, any> = {};
                    let currentCostCents = 0;

                    const compData = data.components || {};
                    if (Array.isArray(compData)) {
                        for (const row of compData) {
                            if (row.product_variant) {
                                transformed[row.category_id || "unknown"] = row.product_variant;
                                if (row.product_variant.current_price?.amount_cents) {
                                    currentCostCents += row.product_variant.current_price.amount_cents;
                                }
                            }
                        }
                    } else {
                        // Handle object map case directly
                        for (const [cat, variant] of Object.entries(compData)) {
                            if (variant) {
                                transformed[cat] = variant;
                                if ((variant as any).current_price?.amount_cents) {
                                    currentCostCents += (variant as any).current_price.amount_cents;
                                }
                            }
                        }
                    }

                    setSelectedComponents(transformed);
                    setBuildAuthorId(data.user_id || null);

                    // Mock the activeProfile specifically for the Budget Bar on Saved Builds!
                    // This implements Edge Case Rules: Legacy Budget Handling.
                    setActiveProfile({
                        name: "Saved Build",
                        targetBudget: data.target_budget ?? 0,                        isCustom: true
                    });

                } else {                    setNotFound(true);
                    toast.error("Build not found or link is broken.");
                }
            } catch(e) {
                console.error("Failed to load build", e);
                setNotFound(true);
                toast.error("Error loading saved build");
            } finally {
                setIsLoadingBuild(false);
            }
        }
        
        fetchSavedBuild();
    }, [router.isReady, id]);

    if (notFound) {
        return (
            <div style={{ textAlign: "center", padding: "100px 20px", color: "#666" }}>
                <h1 style={{ fontSize: "32px", color: "#333", marginBottom: "16px" }}>Build Not Found</h1>
                <p>The build you are looking for does not exist or has been deleted.</p>
                <button 
                    onClick={() => router.push("/pc-builder")}
                    style={{ marginTop: "24px", padding: "12px 24px", backgroundColor: "#1f7a8c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                >
                    Start a New Build
                </button>
            </div>
        );
    }

    return <BuilderWorkspace />;
}

export default function SavedBuildPage() {
    return (
        <div>
            <Header />
            <Head>
                <title>PC Builder | Loading Build...</title>
            </Head>
            <main style={{ padding: "40px 20px", maxWidth: "1600px", margin: "0 auto", minHeight: "80vh" }}>
                <BuilderProvider>
                    <SavedBuildLoader />
                </BuilderProvider>
            </main>
        </div>
    );
}
