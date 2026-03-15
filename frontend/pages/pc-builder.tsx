import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Header from "../components/header/header";
import { useAuth } from "../hooks/useAuth";

import ComputerIcon from "@mui/icons-material/Computer.js";
import MemoryIcon from "@mui/icons-material/Memory.js";
import ToysIcon from "@mui/icons-material/Toys.js";
import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard.js";
import StorageIcon from "@mui/icons-material/Storage.js";
import SaveIcon from "@mui/icons-material/Save.js";
import ExtensionIcon from "@mui/icons-material/Extension.js";
import PowerIcon from "@mui/icons-material/Power.js";

const CategoryIconMap: Record<string, any> = {
    cases: ComputerIcon,
    cpus: MemoryIcon,
    coolers: ToysIcon,
    motherboards: DeveloperBoardIcon,
    ram: MemoryIcon,
    gpus: ExtensionIcon,
    psus: PowerIcon,
    ssds: SaveIcon,
    hdds: StorageIcon,
};

const CategoryImageMap: Record<string, string> = {
    cases: "/icons/pcbuilder/pc-case-svgrepo-com(1).svg",
    cpus: "/icons/pcbuilder/cpu-chip-svgrepo-com.svg",
    coolers: "/icons/pcbuilder/cooler-svgrepo-com.svg",
    gpus: "/icons/pcbuilder/gpu.svg",
    hdds: "/icons/pcbuilder/hard-drive-device-svgrepo-com.svg",
    motherboards: "/icons/pcbuilder/motherboard-svgrepo-com.svg",
    psus: "/icons/pcbuilder/power-socket-svgrepo-com.svg",
    ram: "/icons/pcbuilder/ram-memory-svgrepo-com.svg",
    ssds: "/icons/pcbuilder/ssd-svgrepo-com.svg",
};

// Standard PC component categories matching the image closely
const CATEGORIES = [
    { id: "cases", name: "Chassis" },
    { id: "cpus", name: "CPU" },
    { id: "coolers", name: "CPU Cooler" },
    { id: "motherboards", name: "Motherboard" },
    { id: "ram", name: "Memory" },
    { id: "gpus", name: "Graphics Card" },
    { id: "psus", name: "PSU" },
    { id: "ssds", name: "Storage (SSD)" },
    { id: "hdds", name: "Storage (HDD)" },
];

const API_BASE =
    typeof window === "undefined"
        ? process.env.SERVER_API_BASE_URL || "http://web"
        : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

const ENDPOINT_MAP: Record<string, string> = {
    cases: "cases",
    cpus: "cpus",
    coolers: "case-fans",
    motherboards: "motherboards",
    ram: "ram",
    gpus: "gpus",
    psus: "psus",
    ssds: "ssds",
    hdds: "hdds",
};

const getSpecs = (prod: any) => {
    const skip = [
        "variant_id",
        "title",
        "sku",
        "current_price",
        "thumbnail",
        "stock",
        "slug",
        "manufacturer",
        "product_type",
        "board_partner",
        "description",
        "images",
        "id",
        "category_id",
        "created_at",
        "updated_at",
        "brand_id",
    ];
    const pills: string[] = [];
    for (const key of Object.keys(prod)) {
        if (skip.includes(key)) continue;
        if (
            prod[key] &&
            (typeof prod[key] === "string" || typeof prod[key] === "number")
        ) {
            const label = key.replace(/_/g, " ");
            pills.push(prod[key].toString());
        }
    }
    return pills.slice(0, 5);
};

export default function PcBuilder() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState("cases");
    const [selectedComponents, setSelectedComponents] = useState<
        Record<string, any>
    >({});

    const [productsCache, setProductsCache] = useState<Record<string, any[]>>({});
    const [loadingCategory, setLoadingCategory] = useState(false);

    // Save feature state
    const [buildName, setBuildName] = useState("My Build 1");
    const [shareToken, setShareToken] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingBuild, setIsLoadingBuild] = useState(false);
    const [buildAuthorId, setBuildAuthorId] = useState<number | null>(null);

    // Initial load of build if query token exists
    useEffect(() => {
        if (!router.isReady) return;
        const token = router.query.build_id as string;
        if (token && token !== shareToken) {
            fetchBuild(token);
        }
    }, [router.isReady, router.query]);

    const fetchBuild = async (token: string) => {
        setIsLoadingBuild(true);
        try {
            const res = await fetch(`${API_BASE}/api/pc-builds/${token}`);
            if (res.ok) {
                const data = await res.json();
                setBuildName(data.name || "My Build 1");
                setShareToken(data.share_token);
                setSelectedComponents(data.components || {});
                setBuildAuthorId(data.user_id);
            }
        } catch(e) {
            console.error("Failed to load build", e);
        } finally {
            setIsLoadingBuild(false);
        }
    };

    const handleSave = async (saveAsNew = false) => {
        if (!user) {
            alert("Please log in to save builds");
            return;
        }

        setIsSaving(true);
        try {
            const componentsMap: Record<string, string> = {};
            for (const cat in selectedComponents) {
                componentsMap[cat] = selectedComponents[cat].variant_id;
            }

            const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : "";

            const res = await fetch(`${API_BASE}/api/pc-builds`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: buildName,
                    components: componentsMap,
                    share_token: shareToken,
                    save_as_new: saveAsNew
                })
            });

            if (res.ok) {
                const data = await res.json();
                setShareToken(data.share_token);
                setBuildName(data.name);
                alert("Build saved successfully!");
                router.replace(`/pc-builder?build_id=${data.share_token}`, undefined, { shallow: true });
            } else {
                alert("Failed to save build");
            }
        } catch(e) {
            console.error("Failed to save build", e);
            alert("Error saving build");
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate total
    const totalPrice = Object.values(selectedComponents).reduce((sum, item) => {
        const priceCents = item.current_price?.amount_cents || 0;
        return sum + priceCents / 100;
    }, 0);

    useEffect(() => {
        const slug = ENDPOINT_MAP[activeCategory];
        if (!slug) return;

        if (productsCache[activeCategory]) {
            return; // Already loaded
        }

        const fetchItems = async () => {
            setLoadingCategory(true);
            try {
                const res = await fetch(`${API_BASE}/api/${slug}?per_page=50`);
                if (res.ok) {
                    const json = await res.json();
                    setProductsCache((prev) => ({
                        ...prev,
                        [activeCategory]: json.data || [],
                    }));
                }
            } catch (e) {
                console.error("Failed to fetch builder products", e);
            } finally {
                setLoadingCategory(false);
            }
        };
        fetchItems();
    }, [activeCategory, productsCache]);

    const handleSelectToggle = (category: string, product: any) => {
        setSelectedComponents((prev) => {
            const isCurrentlySelected =
                prev[category]?.variant_id === product.variant_id;
            const newSelection = { ...prev };

            if (isCurrentlySelected) {
                delete newSelection[category];
            } else {
                newSelection[category] = product;
            }

            return newSelection;
        });
    };

    const handleRemove = (e: React.MouseEvent, category: string) => {
        e.stopPropagation();
        setSelectedComponents((prev) => {
            const newSelection = { ...prev };
            delete newSelection[category];
            return newSelection;
        });
    };

    const activeProducts = productsCache[activeCategory] || [];

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#f4f4f6",
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Head>
                <title>PC Builder | WiredWorkshop</title>
            </Head>

            <Header />

            <main
                style={{
                    maxWidth: "1400px",
                    margin: "0 auto",
                    width: "100%",
                    padding: "24px",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    paddingBottom: "120px",
                }}
            >
                <div
                    style={{
                        paddingBottom: "16px",
                        color: "#333",
                        fontWeight: 700,
                        fontSize: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span>System Builder</span>
                        <span style={{color: "#ccc"}}>|</span>
                        <input 
                            type="text" 
                            value={buildName} 
                            onChange={(e) => setBuildName(e.target.value)}
                            placeholder="My Build 1"
                            style={{
                                fontSize: "20px",
                                fontWeight: 600,
                                padding: "4px 8px",
                                border: "1px solid transparent",
                                borderRadius: "4px",
                                backgroundColor: "transparent",
                                outline: "none",
                                transition: "all 0.2s",
                                cursor: "pointer",
                                width: "300px"
                            }}
                            onFocus={(e) => {
                                e.target.style.backgroundColor = "#fff";
                                e.target.style.border = "1px solid #1f7a8c";
                            }}
                            onBlur={(e) => {
                                e.target.style.backgroundColor = "transparent";
                                e.target.style.border = "1px solid transparent";
                            }}
                        />
                    </div>
                    
                    {user && (
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={() => handleSave(false)}
                                disabled={isSaving}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#1f7a8c",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    cursor: isSaving ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px"
                                }}
                            >
                                <SaveIcon fontSize="small" />
                                {isSaving ? "Saving..." : "Save Build"}
                            </button>
                            
                            {shareToken && (
                                <button
                                    onClick={() => handleSave(true)}
                                    disabled={isSaving}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor: "#f4f4f6",
                                        color: "#1f7a8c",
                                        border: "1px solid #1f7a8c",
                                        borderRadius: "8px",
                                        fontWeight: 600,
                                        cursor: isSaving ? "not-allowed" : "pointer"
                                    }}
                                >
                                    Save as New
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: "flex", gap: "24px", flex: 1 }}>
                    {/* Left Sidebar - Categories */}
                    <div
                        style={{
                            width: "340px",
                            flexShrink: 0,
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                        }}
                    >
                        {CATEGORIES.map((cat) => {
                            const isSelected = activeCategory === cat.id;
                            const selectedItem = selectedComponents[cat.id];
                            const IconComponent = CategoryIconMap[cat.id] || ComputerIcon;
                            const customImage = CategoryImageMap[cat.id];

                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "12px",
                                        backgroundColor: "#fff",
                                        border: isSelected
                                            ? "1px solid #1f7a8c"
                                            : "1px solid #e0e0e0",
                                        borderRadius: "6px",
                                        cursor: "pointer",
                                        boxShadow: isSelected
                                            ? "0 4px 12px rgba(31,122,140,0.1)"
                                            : "0 1px 2px rgba(0,0,0,0.02)",
                                        transition: "all 0.15s ease",
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                >
                                    {/* Accent line for active column */}
                                    {isSelected && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: "4px",
                                                backgroundColor: "#1f7a8c",
                                            }}
                                        />
                                    )}

                                    <div
                                        style={{
                                            width: "50px",
                                            height: "50px",
                                            flexShrink: 0,
                                            backgroundColor: selectedItem
                                                ? "#fff"
                                                : "#f0f4f5",
                                            borderRadius: "4px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginRight: "14px",
                                            color: "#1f7a8c",
                                            border: selectedItem
                                                ? "1px solid #eee"
                                                : "none",
                                        }}
                                    >
                                        {selectedItem?.thumbnail ? (
                                            <img
                                                src={selectedItem.thumbnail}
                                                alt={selectedItem.title}
                                                style={{
                                                    maxWidth: "90%",
                                                    maxHeight: "90%",
                                                    objectFit: "contain",
                                                }}
                                            />
                                        ) : customImage ? (
                                            <img src={customImage} alt={cat.name} style={{ width: 28, height: 28 }} />
                                        ) : (
                                            <IconComponent style={{ width: 24, height: 24, fill: "currentColor" }} />
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            paddingRight: "10px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: 700,
                                                color: "#333",
                                                fontSize: "15px",
                                                marginBottom: "2px",
                                            }}
                                        >
                                            {cat.name}
                                        </div>
                                        {selectedItem ? (
                                            <>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#555",
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow:
                                                            "ellipsis",
                                                    }}
                                                >
                                                    {selectedItem.title}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "14px",
                                                        color: "#1f7a8c",
                                                        fontWeight: 700,
                                                        marginTop: "2px",
                                                    }}
                                                >
                                                    R{" "}
                                                    {(
                                                        selectedItem
                                                            .current_price
                                                            ?.amount_cents /
                                                            100 || 0
                                                    ).toLocaleString("en-ZA", {
                                                        minimumFractionDigits: 0,
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#888",
                                                    fontWeight: 500,
                                                }}
                                            >
                                                PLEASE SELECT
                                            </div>
                                        )}
                                    </div>

                                    {selectedItem && (
                                        <div
                                            style={{
                                                padding: "8px",
                                                color: "#999",
                                                cursor: "pointer",
                                                transition: "color 0.2s",
                                            }}
                                            onClick={(e) =>
                                                handleRemove(e, cat.id)
                                            }
                                            onMouseOver={(e) =>
                                                (e.currentTarget.style.color =
                                                    "#dc2626")
                                            }
                                            onMouseOut={(e) =>
                                                (e.currentTarget.style.color =
                                                    "#999")
                                            }
                                        >
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Right Pane - Product Selection */}
                    <div
                        style={{
                            flex: 1,
                            backgroundColor: "#fff",
                            border: "1px solid #e0e0e0",
                            borderRadius: "8px",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            minHeight: "600px",
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: "16px 24px",
                                borderBottom: "1px solid #e0e0e0",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                backgroundColor: "#fafafa",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    color: "#333",
                                }}
                            >
                                <div
                                    style={{
                                        width: "24px",
                                        height: "24px",
                                        color: "#666",
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect
                                            x="2"
                                            y="3"
                                            width="20"
                                            height="14"
                                            rx="2"
                                            ry="2"
                                        ></rect>
                                        <line
                                            x1="8"
                                            y1="21"
                                            x2="16"
                                            y2="21"
                                        ></line>
                                        <line
                                            x1="12"
                                            y1="17"
                                            x2="12"
                                            y2="21"
                                        ></line>
                                    </svg>
                                </div>
                                <h2
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: 700,
                                        margin: 0,
                                    }}
                                >
                                    {
                                        CATEGORIES.find(
                                            (c) => c.id === activeCategory,
                                        )?.name
                                    }
                                </h2>
                                <span
                                    style={{
                                        backgroundColor: "#e2e8f0",
                                        padding: "2px 8px",
                                        borderRadius: "12px",
                                        fontSize: "12px",
                                        color: "#555",
                                        fontWeight: 600,
                                    }}
                                >
                                    {activeProducts.length}
                                </span>
                            </div>

                            <div
                                style={{
                                    display: "flex",
                                    gap: "12px",
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="text"
                                    placeholder="Quick Filter"
                                    style={{
                                        padding: "8px 14px",
                                        border: "1px solid #ccc",
                                        borderRadius: "5px",
                                        fontSize: "13px",
                                        width: "200px",
                                        outline: "none",
                                    }}
                                />
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        color: "#555",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                    }}
                                >
                                    Filtering{" "}
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line
                                            x1="4"
                                            y1="21"
                                            x2="4"
                                            y2="14"
                                        ></line>
                                        <line
                                            x1="4"
                                            y1="10"
                                            x2="4"
                                            y2="3"
                                        ></line>
                                        <line
                                            x1="12"
                                            y1="21"
                                            x2="12"
                                            y2="12"
                                        ></line>
                                        <line
                                            x1="12"
                                            y1="8"
                                            x2="12"
                                            y2="3"
                                        ></line>
                                        <line
                                            x1="20"
                                            y1="21"
                                            x2="20"
                                            y2="16"
                                        ></line>
                                        <line
                                            x1="20"
                                            y1="12"
                                            x2="20"
                                            y2="3"
                                        ></line>
                                        <line
                                            x1="1"
                                            y1="14"
                                            x2="7"
                                            y2="14"
                                        ></line>
                                        <line
                                            x1="9"
                                            y1="8"
                                            x2="15"
                                            y2="8"
                                        ></line>
                                        <line
                                            x1="17"
                                            y1="16"
                                            x2="23"
                                            y2="16"
                                        ></line>
                                    </svg>
                                </div>
                                <select
                                    style={{
                                        padding: "8px 14px",
                                        border: "1px solid #ccc",
                                        borderRadius: "5px",
                                        fontSize: "13px",
                                        backgroundColor: "#fff",
                                        outline: "none",
                                    }}
                                >
                                    <option>Most popular</option>
                                    <option>Price: Low to High</option>
                                    <option>Price: High to Low</option>
                                </select>
                            </div>
                        </div>

                        {/* Product List */}
                        <div
                            style={{
                                overflowY: "auto",
                                flex: 1,
                                backgroundColor: "#fafafa",
                                padding: "16px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                            }}
                        >
                            {loadingCategory ? (
                                <div
                                    style={{
                                        padding: "80px",
                                        textAlign: "center",
                                        color: "#666",
                                    }}
                                >
                                    Loading components...
                                </div>
                            ) : activeProducts.length > 0 ? (
                                activeProducts.map((product: any) => {
                                    const isItemActive =
                                        selectedComponents[activeCategory]
                                            ?.variant_id === product.variant_id;
                                    const specs = getSpecs(product);

                                    return (
                                        <div
                                            key={product.variant_id}
                                            style={{
                                                display: "flex",
                                                padding: "24px",
                                                border: isItemActive
                                                    ? "1px solid #1f7a8c"
                                                    : "1px solid #eaeaea",
                                                borderRadius: "8px",
                                                gap: "24px",
                                                alignItems: "stretch",
                                                backgroundColor: isItemActive
                                                    ? "#fcfdfd"
                                                    : "#fff",
                                                boxShadow: isItemActive
                                                    ? "0 4px 12px rgba(31,122,140,0.08)"
                                                    : "0 2px 8px rgba(0,0,0,0.02)",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "140px",
                                                    height: "140px",
                                                    flexShrink: 0,
                                                    backgroundColor: "#fff",
                                                    borderRadius: "4px",
                                                    border: "1px solid #eee",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                {product.thumbnail ? (
                                                    <img
                                                        src={product.thumbnail}
                                                        alt={product.title}
                                                        style={{
                                                            maxWidth: "85%",
                                                            maxHeight: "85%",
                                                            objectFit:
                                                                "contain",
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            color: "#ccc",
                                                        }}
                                                    >
                                                        No Image
                                                    </div>
                                                )}
                                            </div>

                                            <div
                                                style={{
                                                    flex: 1,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent:
                                                        "space-between",
                                                }}
                                            >
                                                <div>
                                                    <a
                                                        href={`/product/${
                                                            product.slug
                                                                ? product.slug
                                                                : encodeURIComponent(
                                                                      product.title
                                                                          .replace(
                                                                              /[^a-zA-Z0-9- ]/g,
                                                                              "",
                                                                          )
                                                                          .replace(
                                                                              /\\s+/g,
                                                                              "-",
                                                                          )
                                                                          .toLowerCase(),
                                                                  )
                                                        }`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        style={{
                                                            textDecoration:
                                                                "none",
                                                            color: "inherit",
                                                        }}
                                                    >
                                                        <h3
                                                            style={{
                                                                fontSize:
                                                                    "16px",
                                                                color: "#111",
                                                                marginBottom:
                                                                    "12px",
                                                                lineHeight: 1.4,
                                                                fontWeight: 600,
                                                                cursor: "pointer",
                                                                transition:
                                                                    "color 0.2s ease",
                                                            }}
                                                            onMouseOver={(e) =>
                                                                (e.currentTarget.style.color =
                                                                    "#1f7a8c")
                                                            }
                                                            onMouseOut={(e) =>
                                                                (e.currentTarget.style.color =
                                                                    "#111")
                                                            }
                                                            title={`View specs for ${product.title} in new tab`}
                                                        >
                                                            {product.title}
                                                        </h3>
                                                    </a>

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            flexWrap: "wrap",
                                                            gap: "8px",
                                                            marginBottom:
                                                                "16px",
                                                        }}
                                                    >
                                                        {specs.map(
                                                            (
                                                                spec: string,
                                                                idx: number,
                                                            ) => (
                                                                <span
                                                                    key={idx}
                                                                    style={{
                                                                        padding:
                                                                            "4px 8px",
                                                                        backgroundColor:
                                                                            "#f9fafb",
                                                                        color: "#4b5563",
                                                                        border: "1px solid #e5e7eb",
                                                                        borderRadius:
                                                                            "4px",
                                                                        fontSize:
                                                                            "12px",
                                                                    }}
                                                                >
                                                                    {spec}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems: "flex-end",
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "24px",
                                                                fontWeight: 800,
                                                                color: "#1f7a8c",
                                                            }}
                                                        >
                                                            R{" "}
                                                            {(
                                                                product
                                                                    .current_price
                                                                    ?.amount_cents /
                                                                    100 || 0
                                                            ).toLocaleString(
                                                                "en-ZA",
                                                                {
                                                                    minimumFractionDigits: 0,
                                                                },
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "24px",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                color:
                                                                    product
                                                                        .stock
                                                                        ?.status ===
                                                                    "in_stock"
                                                                        ? "green"
                                                                        : product
                                                                                .stock
                                                                                ?.status ===
                                                                            "out_of_stock"
                                                                          ? "#c00"
                                                                          : product
                                                                                  .stock
                                                                                  ?.status ===
                                                                              "reserved"
                                                                            ? "#f59e0b"
                                                                            : "#999",
                                                                fontSize:
                                                                    "13px",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "4px",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {product.stock
                                                                ?.status ===
                                                            "in_stock"
                                                                ? "In stock"
                                                                : product.stock
                                                                        ?.status ===
                                                                    "out_of_stock"
                                                                  ? "Out of stock"
                                                                  : product
                                                                          .stock
                                                                          ?.status ===
                                                                      "reserved"
                                                                    ? "Reserved"
                                                                    : "Check stock"}
                                                        </div>

                                                        <button
                                                            onClick={() =>
                                                                handleSelectToggle(
                                                                    activeCategory,
                                                                    product,
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "10px 24px",
                                                                backgroundColor:
                                                                    isItemActive
                                                                        ? "#fef2f2"
                                                                        : "#fff",
                                                                color: isItemActive
                                                                    ? "#dc2626"
                                                                    : "#1f7a8c",
                                                                border: `2px solid ${isItemActive ? "#dc2626" : "#1f7a8c"}`,
                                                                borderRadius:
                                                                    "4px",
                                                                fontWeight: 700,
                                                                fontSize:
                                                                    "14px",
                                                                cursor: "pointer",
                                                                transition:
                                                                    "all 0.2s ease",
                                                                minWidth:
                                                                    "120px",
                                                            }}
                                                        >
                                                            {isItemActive
                                                                ? "Deselect"
                                                                : "Select"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div
                                    style={{
                                        padding: "80px",
                                        textAlign: "center",
                                        color: "#888",
                                    }}
                                >
                                    <svg
                                        width="48"
                                        height="48"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <line
                                            x1="12"
                                            y1="8"
                                            x2="12"
                                            y2="12"
                                        ></line>
                                        <line
                                            x1="12"
                                            y1="16"
                                            x2="12.01"
                                            y2="16"
                                        ></line>
                                    </svg>
                                    <h3
                                        style={{
                                            marginTop: "16px",
                                            color: "#333",
                                        }}
                                    >
                                        No Products Found
                                    </h3>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Sticky Bar */}
            <div
                style={{
                    position: "fixed",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: "#fafafa",
                    borderTop: "1px solid #e0e0e0",
                    boxShadow: "0 -4px 10px rgba(0,0,0,0.02)",
                    padding: "20px 32px",
                    zIndex: 100,
                }}
            >
                <div
                    style={{
                        maxWidth: "1400px",
                        margin: "0 auto",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                        }}
                    >
                        <span
                            style={{
                                fontSize: "16px",
                                color: "#555",
                                fontWeight: 600,
                            }}
                        >
                            Total
                        </span>
                        <span
                            style={{
                                fontSize: "28px",
                                fontWeight: 800,
                                color: "#1f7a8c",
                            }}
                        >
                            R{" "}
                            {totalPrice.toLocaleString("en-ZA", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                            })}
                        </span>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "24px",
                        }}
                    >
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                cursor: "pointer",
                                fontSize: "14px",
                                color: "#333",
                                fontWeight: 600,
                            }}
                        >
                            <input
                                type="checkbox"
                                style={{
                                    width: "18px",
                                    height: "18px",
                                    accentColor: "#1f7a8c",
                                }}
                            />
                            Build it for me!
                        </label>

                        <button
                            style={{
                                padding: "12px 32px",
                                backgroundColor: "#111",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                                fontSize: "15px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                opacity: totalPrice > 0 ? 1 : 0.5,
                            }}
                            disabled={totalPrice === 0}
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="9" cy="21" r="1"></circle>
                                <circle cx="20" cy="21" r="1"></circle>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                            </svg>
                            Go to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
