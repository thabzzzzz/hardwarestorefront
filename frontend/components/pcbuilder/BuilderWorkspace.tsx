import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Header from "../../components/header/header";
import { useAuth } from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";
import { toast } from "../../lib/toast";
import { useBuilder } from "../../context/BuilderContext";

import ArrowBackIcon from "@mui/icons-material/ArrowBack.js";
import ComputerIcon from "@mui/icons-material/Computer.js";
import MemoryIcon from "@mui/icons-material/Memory.js";
import ToysIcon from "@mui/icons-material/Toys.js";
import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard.js";
import StorageIcon from "@mui/icons-material/Storage.js";
import SaveIcon from "@mui/icons-material/Save.js";
import ExtensionIcon from "@mui/icons-material/Extension.js";
import PowerIcon from "@mui/icons-material/Power.js";
import EditIcon from "@mui/icons-material/Edit.js";
import ReportProblemIcon from "@mui/icons-material/ReportProblem.js";
import CheckCircleIcon from "@mui/icons-material/CheckCircle.js";
import MoreVertIcon from "@mui/icons-material/MoreVert.js";
import CloseIcon from "@mui/icons-material/Close.js";
import InfoIcon from "@mui/icons-material/Info.js";
import RefreshIcon from "@mui/icons-material/Refresh.js";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline.js";

import {
    validateBuild,
    ValidationMessage,
    getComponentCompatibility,
} from "../../lib/compatibilityEngine";
import { BUILD_PROFILES } from "../../lib/pc-builder-profiles";

import { BudgetTracker } from "./BudgetTracker";
import { AllocationModal } from "./AllocationModal";

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
    { id: "coolers", name: "System Cooling" },
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

const formatCores = (cores: any, title: string = ""): string | null => {
    if (cores !== undefined && cores !== null && cores !== "") {
        const c = cores.toString().trim();
        if (/\d+\s*-?\s*Core/i.test(c)) return c;
        if (/^\d+$/.test(c)) return `${c}-Core`;
        return c;
    }
    const match = title.match(/(\d+)\s*-?\s*Core/i);
    if (match) return `${match[1]}-Core`;
    return null;
};

const formatSocket = (socket: any, title: string = ""): string | null => {
    if (socket !== undefined && socket !== null && socket !== "") {
        return socket.toString().trim();
    }
    const match = title.match(/\b(AM[345]|LGA\s*\d+|sTRX4|TR4|sWRX8|SP3)\b/i);
    if (match) return match[0].toUpperCase().replace(/\s+/g, " ");
    return null;
};

const getSpecs = (prod: any) => {
    const pills: string[] = [];
    const norm = prod.normalized_specs || {};
    const title = prod.title || prod.name || "";
    const productType = (prod.product_type || "").toLowerCase();
    const isGpu = productType === "gpus" || productType === "gpu";
    const isCpu = productType === "cpus" || productType === "cpu";
    const isCase = productType === "cases" || productType === "computer-cases";
    const isMotherboard = productType === "motherboards" || productType === "motherboard";
    const isRam = productType === "ram" || productType === "memory" || productType === "rams";
    const isStorage = productType === "ssds" || productType === "hdds" || productType === "ssd" || productType === "hdd";

    // 1. Brand / manufacturer
    const brand = prod.brand || prod.manufacturer;
    if (brand) {
        pills.push(brand.toString());
    }

    if (isCase) {
        // 2. Motherboard form factors (e.g. ATX, Micro ATX, Mini ITX)
        const mbFormFactors = norm.mb_form_factors;
        if (Array.isArray(mbFormFactors) && mbFormFactors.length > 0) {
            for (const f of mbFormFactors.slice(0, 2)) {
                if (f) pills.push(f.toString());
            }
        }

        // 3. Max GPU length
        const maxGpuLength = norm.max_gpu_length_mm;
        if (maxGpuLength !== undefined && maxGpuLength !== null && maxGpuLength !== "") {
            pills.push(`GPU ${maxGpuLength}mm`);
        }

        // 4. Case type/size (e.g. Mid Tower) — only if short and sane
        const caseType = norm.case_type;
        if (caseType && typeof caseType === "string" && caseType.length <= 40 && !caseType.toLowerCase().includes("ryzen")) {
            pills.push(caseType);
        }
    }

    if (isGpu) {
        // 2. GPU board partner (e.g. ASUS, Gigabyte)
        const boardPartner = prod.board_partner;
        if (boardPartner && boardPartner.toString().toLowerCase() !== (brand || "").toString().toLowerCase()) {
            pills.push(boardPartner.toString());
        }

        // 3. VRAM
        const vram = prod.vram_gb ?? norm.vram_gb ?? norm.vram;
        if (vram !== undefined && vram !== null && vram !== "") {
            pills.push(`${vram}GB`);
        }

        // 4. VRAM type
        const vramType = prod.vram_type ?? norm.vram_type;
        if (vramType) {
            pills.push(vramType.toString());
        }

        // 5. TDP
        const tdp = prod.tdp_watts ?? norm.tdp_watts ?? norm.tdp;
        if (tdp !== undefined && tdp !== null && tdp !== "") {
            pills.push(`${tdp}W`);
        }

        // 6. Boost clock
        const boost = prod.boost_clock_mhz ?? norm.boost_clock_mhz ?? prod.boost_clock;
        if (boost !== undefined && boost !== null && boost !== "") {
            const num = Number(boost);
            if (!isNaN(num)) {
                if (num >= 1000) {
                    pills.push(`${(num / 1000).toFixed(2)} GHz`);
                } else {
                    pills.push(`${num} MHz`);
                }
            } else {
                pills.push(boost.toString());
            }
        }

        // 7. Bus width
        const busWidth = prod.bus_width ?? norm.bus_width;
        if (busWidth) {
            pills.push(busWidth.toString());
        }
    }

    if (isRam) {
        // 2. Memory type (e.g. DDR5)
        const memoryType = prod.memory_type ?? norm.memory_type;
        if (memoryType) {
            pills.push(memoryType.toString());
        }

        // 3. Kit size (e.g. 32GB, 64GB)
        const modules = norm.modules;
        if (modules && typeof modules === "object") {
            const count = modules.count ?? 1;
            const sizeGb = modules.size_gb ?? 0;
            if (count && sizeGb) {
                const total = count * sizeGb;
                pills.push(`${total}GB`);
                pills.push(`${count} x ${sizeGb}GB`);
            }
        }

        // 4. Total capacity fallback
        const capacity = prod.capacity_gb ?? norm.capacity_gb;
        if (capacity) {
            pills.push(`${capacity}GB`);
        }
    }

    if (isStorage) {
        // 2. Capacity parsed from title (e.g. 1TB, 2TB, 4TB)
        const capacityMatch = title.match(/(\d+(?:\.\d+)?)\s*(TB|GB|tb|gb)/i);
        if (capacityMatch) {
            const value = capacityMatch[1];
            const unit = capacityMatch[2].toUpperCase();
            pills.push(`${value}${unit}`);
        }

        // 3. First useful short specs (interface, form factor, speed)
        if (prod.short_specs && Array.isArray(prod.short_specs)) {
            for (const s of prod.short_specs) {
                const text = typeof s === "string" ? s : JSON.stringify(s);
                if (text && !pills.includes(text)) {
                    pills.push(text);
                }
                if (pills.length >= 4) break;
            }
        }
    }

    if (isMotherboard) {
        // 2. Socket
        const socket = formatSocket(prod.socket ?? norm.socket, title);
        if (socket) {
            pills.push(socket);
        }

        // 3. Form factor
        const formFactor = prod.form_factor ?? norm.form_factor;
        if (formFactor) {
            pills.push(formFactor.toString());
        }

        // 4. Memory type
        const memoryType = prod.memory_type ?? norm.memory_type;
        if (memoryType) {
            pills.push(memoryType.toString());
        }

        // 5. Memory slots
        const memorySlots = prod.memory_slots ?? norm.memory_slots;
        if (memorySlots !== undefined && memorySlots !== null && memorySlots !== "") {
            pills.push(`${memorySlots} Slots`);
        }
    }

    if (isCpu) {
        // 2. Cores
        const cores = formatCores(
            prod.cores ?? norm.cores ?? norm.core_count,
            title,
        );
        if (cores) {
            pills.push(cores);
        }

        // 3. Socket
        const socket = formatSocket(prod.socket ?? norm.socket, title);
        if (socket) {
            pills.push(socket);
        }

        // 4. Boost clock
        const boost = prod.boost_clock ?? norm.boost_clock;
        if (boost !== undefined && boost !== null && boost !== "") {
            pills.push(boost.toString());
        }
    }

    // Fallback to short_specs if we have too few useful tags
    if (pills.length < 3 && prod.short_specs && Array.isArray(prod.short_specs)) {
        for (const s of prod.short_specs) {
            const text = typeof s === "string" ? s : JSON.stringify(s);
            if (text && !pills.includes(text)) {
                pills.push(text);
            }
            if (pills.length >= 3) break;
        }
    }

    return pills.slice(0, 5);
};

export function BuilderWorkspace() {
    const { user } = useAuth();
    const router = useRouter();
    const cart = useCart();

    const {
        activeProfile,
        setActiveProfile,
        activeCategory,
        setActiveCategory,
        isModalOpen,
        setIsModalOpen,
        isModified,
        setIsModified,
        selectedComponents,
        setSelectedComponents,
        productsCache,
        setProductsCache,
        loadingCategory,
        setLoadingCategory,
        buildName,
        setBuildName,
        shareToken,
        setShareToken,
        isSaving,
        setIsSaving,
        isLoadingBuild,
        setIsLoadingBuild,
        buildAuthorId,
        setBuildAuthorId,
        searchQuery,
        setSearchQuery,
    } = useBuilder();

    const [sortOrder, setSortOrder] = useState("recommended");
    const [activeTab, setActiveTab] = useState<"edit" | "overview">("edit");
    const [isFabOpen, setIsFabOpen] = useState(false);

    // Mobile Drawers
    const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Reset filters and search when category changes
    useEffect(() => {
        setSearchQuery("");
        setSortOrder("recommended");
    }, [activeCategory, setSearchQuery]);

    // Ensure body scroll is locked when a drawer is open
    useEffect(() => {
        if (isCategoryDrawerOpen || isFilterDrawerOpen) {
            document.body.style.overflow = "hidden";
            setIsFabOpen(false); // Hide FAB when drawers open
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isCategoryDrawerOpen, isFilterDrawerOpen]);

    const hideFab = isCategoryDrawerOpen || isFilterDrawerOpen;

    const handleProfileSelect = (profile: any) => {
        setActiveProfile(profile);
        setSelectedComponents(profile.seed || {});
        setBuildName(
            profile.name === "Start from Scratch"
                ? "My Custom Build"
                : profile.name + " Build",
        );
        setIsModified(profile.isCustom ? true : false);
    };

    const buildNameInputRef = useRef<HTMLInputElement>(null);

    const handleAddAllToCart = () => {
        let addedCount = 0;
        let outOfStockCount = 0;

        const products = Object.values(selectedComponents).filter(Boolean);
        if (products.length === 0) {
            toast("Your build is empty. Select components first.");
            return;
        }

        products.forEach((product) => {
            if (!product || (!product.product_id && !product.variant_id))
                return;

            const isOutOfStock = product.stock?.status === "out_of_stock";
            if (isOutOfStock) {
                outOfStockCount++;
                return;
            }

            const entry = {
                id: String(product.product_id || product.variant_id),
                title: product.title || product.name || "Product",
                thumbnail: product.thumbnail || product.clean_thumbnail || null,
                price: product.current_price
                    ? { amount_cents: product.current_price.amount_cents }
                    : product.price
                      ? { amount_cents: product.price.amount_cents }
                      : null,
                stock: product.stock || null,
            };

            cart.addOrUpdate(entry, 1);
            addedCount++;
        });

        if (addedCount > 0 && outOfStockCount === 0) {
            toast.success("Added " + addedCount + " components to your cart!");
        } else if (addedCount > 0 && outOfStockCount > 0) {
            toast.success(
                "Added " +
                    addedCount +
                    " components to your cart, but " +
                    outOfStockCount +
                    " were out of stock.",
            );
        } else if (outOfStockCount > 0) {
            toast.error(
                "Could not add components: " +
                    outOfStockCount +
                    " items are out of stock.",
            );
        }
    };

    const handleSave = async (saveAsNew = false) => {
        if (!user) {
            toast.error("Please log in to save builds");
            return;
        }

        setIsSaving(true);
        try {
            const componentsMap: Record<string, string> = {};
            for (const cat in selectedComponents) {
                componentsMap[cat] = selectedComponents[cat].variant_id;
            }

            const token =
                typeof window !== "undefined"
                    ? localStorage.getItem("auth_token")
                    : "";

            const res = await fetch(`${API_BASE}/api/pc-builds`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: buildName,
                    components: componentsMap,
                    share_token: shareToken,
                    save_as_new: saveAsNew,
                    target_budget: activeProfile?.targetBudget ?? 0,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setShareToken(data.share_token);
                setBuildName(data.name);
                toast.success(
                    saveAsNew
                        ? "Build saved as new successfully!"
                        : "Build saved successfully!",
                );
                // Don't navigate - just update state to prevent layout shift
                // router.replace(`/build/${data.share_token}`, undefined, {
                //     shallow: true,
                // });
            } else {
                toast.error("Failed to save build");
            }
        } catch (e) {
            console.error("Failed to save build", e);
            toast.error("Error saving build");
        } finally {
            setIsSaving(false);
        }
    };

    const markAsCustomModified = (extraUpdates: any = {}) => {
        setIsModified(true);
        if (
            activeProfile &&
            !activeProfile.isCustom &&
            !activeProfile.name.toLowerCase().includes("custom")
        ) {
            setActiveProfile((prev: any) => ({
                ...prev,
                ...extraUpdates,
                isCustom: true,
                name: `Custom ${prev.name}`,
            }));
            setBuildName(`Custom ${activeProfile.name} Build`);
        } else if (Object.keys(extraUpdates).length > 0) {
            setActiveProfile((prev: any) => ({
                ...prev,
                ...extraUpdates,
                isCustom: true,
            }));
        }
    };

    // Calculate total
    const handleUpdateTargetBudget = (newTarget: number) => {
        if (!activeProfile) return;
        markAsCustomModified({ targetBudget: newTarget });
    };

    const totalPrice = Object.values(selectedComponents || {}).reduce(
        (sum, item: any) => {
            const priceCents =
                item?.current_price?.amount_cents ||
                item?.price?.amount_cents ||
                0;
            return sum + priceCents / 100;
        },
        0,
    );

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
        markAsCustomModified();
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
        markAsCustomModified();
        setSelectedComponents((prev) => {
            const newSelection = { ...prev };
            delete newSelection[category];
            return newSelection;
        });
    };

    const activeProducts = productsCache[activeCategory] || [];

    const sortedActiveProducts = useMemo(() => {
        let items = [...activeProducts];

        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase();
            items = items.filter(
                (p) =>
                    (p.title && p.title.toLowerCase().includes(query)) ||
                    (p.brand && p.brand.toLowerCase().includes(query)) ||
                    (p.model && p.model.toLowerCase().includes(query)),
            );
        }

        if (sortOrder === "price_asc") {
            items.sort(
                (a, b) =>
                    (a.current_price?.amount_cents || 0) -
                    (b.current_price?.amount_cents || 0),
            );
        } else if (sortOrder === "price_desc") {
            items.sort(
                (a, b) =>
                    (b.current_price?.amount_cents || 0) -
                    (a.current_price?.amount_cents || 0),
            );
        }

        const selectedId = selectedComponents[activeCategory]?.variant_id;
        if (!selectedId) return items;

        const selectedIndex = items.findIndex(
            (p) => p.variant_id === selectedId,
        );
        if (selectedIndex > -1) {
            const [selected] = items.splice(selectedIndex, 1);
            items.unshift(selected);
        }
        return items;
    }, [
        activeProducts,
        selectedComponents,
        activeCategory,
        searchQuery,
        sortOrder,
    ]);

    const validationMessages = validateBuild({
        cpu: selectedComponents["cpus"],
        motherboard: selectedComponents["motherboards"],
        ram: selectedComponents["ram"],
        gpu: selectedComponents["gpus"],
        psu: selectedComponents["psus"],
        case: selectedComponents["cases"],
        system_cooling: selectedComponents["coolers"],
    });

    const errorCount = validationMessages.filter(
        (m) => m.type === "error",
    ).length;
    const warningCount = validationMessages.filter(
        (m) => m.type === "warning",
    ).length;

    const renderActionButtons = (isFab: boolean) => {
        const btnStyle: React.CSSProperties = isFab
            ? {
                  padding: "10px 16px",
                  minHeight: "44px",
                  boxSizing: "border-box",
                  backgroundColor: "#1f7a8c",
                  color: "white",
                  border: "none",
                  borderRadius: "22px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease-in-out",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  whiteSpace: "nowrap" as const,
              }
            : {
                  padding: "17px 16px",
                  height: "54px",
                  boxSizing: "border-box",
                  backgroundColor: "#1f7a8c",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.15s ease-in-out",
                  fontFamily: "inherit",
                  fontSize: "14px",
              };

        // We can capture the mouse events:
        const hoverEffects = isFab
            ? {
                  // Mobile buttons don't really need hover translateY, but they get active state
                  onMouseEnter: (e: any) => {},
                  onMouseLeave: (e: any) => {},
              }
            : {
                  onMouseEnter: (e: any) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow =
                          "0 6px 12px rgba(31, 122, 140, 0.4)";
                  },
                  onMouseLeave: (e: any) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                  },
              };

        return (
            <React.Fragment>
                {(isModified || (activeProfile && activeProfile.isCustom)) && (
                    <button
                        onClick={() => {
                            if (
                                activeProfile &&
                                activeProfile.id &&
                                activeProfile.id !== "custom"
                            ) {
                                const baseProfile =
                                    BUILD_PROFILES[
                                        activeProfile.id.replace("custom_", "")
                                    ];
                                if (baseProfile) {
                                    setActiveProfile(
                                        JSON.parse(JSON.stringify(baseProfile)),
                                    );
                                    setSelectedComponents(
                                        baseProfile.seed || {},
                                    );
                                    setBuildName(baseProfile.name);
                                    setIsModified(false);
                                    toast.success(
                                        "Reverted back to base configuration",
                                    );
                                    return;
                                }
                            }
                            setSelectedComponents({});
                            markAsCustomModified();
                            toast.success("Build parts cleared");
                            if (isFab) setIsFabOpen(false);
                        }}
                        style={btnStyle}
                        {...hoverEffects}
                    >
                        {activeProfile &&
                        activeProfile.id &&
                        activeProfile.id !== "custom" ? (
                            <>
                                <RefreshIcon fontSize="small" /> Reset to
                                Defaults
                            </>
                        ) : (
                            <>
                                <DeleteOutlineIcon fontSize="small" /> Clear
                                Parts
                            </>
                        )}
                    </button>
                )}

                {user && (
                    <React.Fragment>
                        {shareToken && (
                            <button
                                onClick={() => {
                                    handleSave(true);
                                    if (isFab) setIsFabOpen(false);
                                }}
                                disabled={isSaving}
                                style={{
                                    ...btnStyle,
                                    cursor: isSaving
                                        ? "not-allowed"
                                        : "pointer",
                                }}
                                {...hoverEffects}
                            >
                                <SaveIcon fontSize="small" /> Save as New
                            </button>
                        )}
                        <button
                            onClick={() => {
                                handleSave(false);
                                if (isFab) setIsFabOpen(false);
                            }}
                            disabled={isSaving}
                            style={{
                                ...btnStyle,
                                cursor: isSaving ? "not-allowed" : "pointer",
                            }}
                            {...hoverEffects}
                        >
                            <SaveIcon fontSize="small" />{" "}
                            {isSaving ? "Saving..." : "Save Build"}
                        </button>
                    </React.Fragment>
                )}

                {!shareToken && activeProfile && !activeProfile.isCustom && (
                    <button
                        onClick={() => {
                            setIsModalOpen(true);
                            if (isFab) setIsFabOpen(false);
                        }}
                        style={btnStyle}
                        {...hoverEffects}
                    >
                        <InfoIcon
                            style={{ marginRight: "6px", fontSize: "18px" }}
                        />{" "}
                        Info
                    </button>
                )}
            </React.Fragment>
        );
    };

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
                <style>{`
                        /* Floating Action Button (FAB) styles */
                        .fab-wrapper { display: none !important; }
    
                        @media (max-width: 900px) {
                            .desktop-action-btns { display: none !important; }
                            .fab-wrapper { display: block !important; }
                            
                            .fab-overlay {
                                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                                background: rgba(0,0,0,0.5); z-index: 9998;
                                opacity: 0; pointer-events: none; transition: opacity 0.2s;
                            }
                            .fab-overlay.open { opacity: 1; pointer-events: auto; }

                            .fab-container {
                                position: fixed; bottom: 100px; right: 24px; z-index: 9999;
                                display: flex; flex-direction: column; align-items: flex-end; gap: 16px;
                            }

                            .fab-menu {
                                display: flex; flex-direction: column; align-items: flex-end; gap: 12px;
                                transform: translateY(20px) scale(0.9); opacity: 0; pointer-events: none;
                                transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s;
                                transform-origin: bottom right;
                            }
                            .fab-menu.open { transform: translateY(0) scale(1); opacity: 1; pointer-events: auto; }
                            
                            .fab-trigger {
                                width: 56px; height: 56px; border-radius: 28px;
                                background-color: #1f7a8c; color: white; border: none;
                                box-shadow: 0 4px 12px rgba(31,122,140,0.4);
                                display: flex; align-items: center; justify-content: center;
                                cursor: pointer; transition: transform 0.2s, background-color 0.2s;
                            }
                            .fab-trigger:active { transform: scale(0.95); }
                        }
    
                    .builder-header-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; }
                    .builder-layout-row { display: flex; gap: 24px; flex: 1; margin-top: 24px; scroll-margin-top: 120px; }
                    .builder-sidebar { width: 340px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px; position: sticky; top: 120px; max-height: calc(100vh - 160px); overflow-y: auto; overscroll-behavior: contain; padding-bottom: 120px; }
                    .builder-catalog-column { flex: 1; display: flex; flex-direction: column; min-width: 0; gap: 0; }
                    .builder-catalog { flex: 1; display: flex; flex-direction: column; gap: 16px; min-width: 0; padding-right: 24px; }
                    
                    /* Desktop rules: Tabs hidden, catalog and tracker always on */
                    .mobile-only-tabs { display: none !important; }
                    .responsive-budget-hidden, .responsive-budget-visible { display: block !important; }
                    .responsive-catalog-hidden, .responsive-catalog-visible { display: flex !important; }
                .responsive-sidebar-hidden { display: flex !important; }

                    /* Offcanvas Mobile Drawers */
                    .mobile-drawer-overlay {
                        position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000;
                        background-color: rgba(0,0,0,0); pointer-events: none; transition: background-color 0.3s ease;
                    }
                    .mobile-drawer-overlay.drawer-open { background-color: rgba(0,0,0,0.5); pointer-events: auto; }

                    .mobile-filter-drawer {
                        position: fixed; top: 0; bottom: 0; z-index: 10001;
                        background-color: #f4f4f6; color: #333; overflow-y: auto; overflow-x: hidden;
                        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1);
                        width: 85%; max-width: 320px; right: 0; transform: translateX(100%);
                        box-shadow: -4px 0 24px rgba(0,0,0,0.08);
                        display: flex; flex-direction: column;
                        padding: 0 12px 16px; box-sizing: border-box;
                        border-left: 1px solid #e0e0e0;
                    }
                    .mobile-filter-drawer.drawer-open { transform: translateX(0); }

                    /* Desktop header visibility */
                    .mobile-sticky-catalog-header { display: none; }
                    .desktop-filters { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }

                    @media (max-width: 900px) {
                        /* Mobile rules: Toggle visibility based on activeTab */
                        .mobile-only-tabs { display: flex !important; }
                        .responsive-budget-hidden { display: none !important; }
                        .responsive-budget-visible { display: block !important; }
                        .responsive-catalog-hidden { display: none !important; }
                        .responsive-catalog-visible { display: flex !important; flex: 1; }
                        
                        /* Sidebar overrides for Drawer mode on Mobile */
                        /* Reset desktop styles for sidebar to become the drawer content */
                        .builder-sidebar {
                            position: fixed !important; top: 0 !important; left: 0 !important; bottom: 0 !important;
                            width: 85% !important; max-width: 360px !important; z-index: 10001 !important;
                            background-color: #f4f4f6 !important;
                            padding: 0 12px 16px !important; margin: 0 !important; overflow-y: auto !important; overflow-x: hidden !important;
                            transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1);
                            display: flex !important; flex-direction: column; gap: 10px !important;
                            border-right: 1px solid #e0e0e0 !important; box-shadow: 4px 0 24px rgba(0,0,0,0.08) !important;
                            /* Desktop sidebar uses max-height: calc(100vh - 380px); clear it so the drawer fills the screen */
                            max-height: none !important;
                            min-height: 100vh;
                            min-height: 100dvh;
                        }
                        .builder-sidebar.drawer-open { transform: translateX(0); }
                        .responsive-sidebar-hidden { display: flex !important; } /* We handle hiding purely via the drawer toggle, since it persists on both tabs if opened, though the button isn't on budget tab. */
                        
                        /* Category rows: do not override card surface — inline styles provide white cards + teal selection */
                        .builder-sidebar > div:not(.category-drawer-header) {
                            background-color: transparent !important;
                            border: none !important;
                            border-bottom: none !important;
                            border-radius: 0 !important;
                            padding: 0 !important;
                            flex-shrink: 0 !important;
                            margin: 0 !important;
                        }
                        .builder-sidebar > div.active-cat {
                            border-left: none !important;
                            background-color: transparent !important;
                        }
                        .builder-sidebar > div:not(.category-drawer-header) > div:nth-child(2) {
                            background-color: transparent !important;
                            border: none !important;
                        }
                        
                        .mobile-total-label { font-size: 18px !important; }
                        .mobile-total-price { font-size: 18px !important; }
                        .mobile-add-btn { height: 44px !important; padding: 10px 16px !important; font-size: 14px !important; }
                        
                        .builder-header-row { font-size: 18px !important; }
                        .mobile-header-input { font-size: 16px !important; padding-left: 0 !important; color: #333 !important; }
                        
                        .mobile-header-title-container { flex-direction: column !important; align-items: flex-start !important; gap: 0px !important; }
                        .mobile-header-title-container span { color: #333 !important; }
                        .mobile-hide { display: none !important; }

                        .builder-layout-row { flex-direction: column; }
                        .builder-catalog-column {
                            gap: 12px !important;
                            width: 100% !important;
                        }
                        .builder-catalog {
                            margin-top: 0 !important;
                            padding: 12px !important;
                            min-height: 400px;
                            border: 1px solid #e0e0e0 !important;
                            box-sizing: border-box;
                            flex: 1 1 auto !important;
                            min-height: 0 !important;
                        }
                        
                        /* Catalog Header for Mobile */
                        .desktop-filters { display: none !important; }
                        .desktop-catalog-header { display: none !important; }
                        /* Toolbar: 60/40 split, full 8px radius (matches catalog cards), light theme */
                        .mobile-sticky-catalog-header {
                            display: flex !important;
                            flex-direction: row !important;
                            align-items: stretch !important;
                            gap: 8px !important;
                            position: sticky;
                            top: var(--brand-height, 73px);
                            z-index: 99;
                            box-sizing: border-box;
                            background-color: #f4f4f6 !important;
                            color: #333 !important;
                            padding: 8px !important;
                            margin: 0 !important;
                            border: 1px solid #e0e0e0 !important;
                            border-radius: 8px !important;
                            box-shadow: 0 1px 2px rgba(0,0,0,0.06) !important;
                            flex-shrink: 0 !important;
                        }
                        .mobile-catalog-cat-name {
                            min-width: 0 !important;
                            display: -webkit-box !important;
                            -webkit-line-clamp: 2 !important;
                            -webkit-box-orient: vertical !important;
                            overflow: hidden !important;
                            line-height: 1.25 !important;
                            word-break: break-word !important;
                            font-weight: 700 !important;
                            font-size: 15px !important;
                            color: #333 !important;
                        }
                        .mobile-catalog-cat-trigger {
                            flex: 7 1 0;
                            min-width: 0;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: flex-start !important;
                            gap: 8px !important;
                            cursor: pointer;
                            background-color: #fff !important;
                            border: 1px solid #e0e0e0 !important;
                            border-radius: 8px !important;
                            padding: 10px 10px !important;
                            min-height: 48px !important;
                            box-sizing: border-box !important;
                            color: #333 !important;
                        }
                        .mobile-catalog-filter-trigger {
                            flex: 3 1 0;
                            min-width: 0;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            gap: 6px !important;
                            cursor: pointer;
                            background-color: #fff !important;
                            border: 1px solid #e0e0e0 !important;
                            border-radius: 8px !important;
                            padding: 10px 8px !important;
                            min-height: 48px !important;
                            box-sizing: border-box !important;
                            color: #555 !important;
                            font-size: 14px !important;
                            font-weight: 600 !important;
                        }

                        /* Filter drawer header — same light chrome as category drawer */
                        .mobile-filter-drawer > .mobile-drawer-header {
                            display: flex; justify-content: space-between; align-items: center;
                            margin-left: -12px; margin-right: -12px; width: calc(100% + 24px); box-sizing: border-box;
                            padding: 16px 20px; border-bottom: 1px solid #e0e0e0; background-color: #fafafa;
                            font-weight: 700; font-size: 18px; color: #333; position: sticky; top: 0; z-index: 2;
                            box-shadow: 0 1px 0 rgba(0,0,0,0.04);
                        }
                        .mobile-filter-drawer input::placeholder { color: #888; opacity: 1; }
                        .builder-sidebar > .category-drawer-header {
                            display: flex; justify-content: space-between; align-items: center;
                            margin-left: -12px; margin-right: -12px; width: calc(100% + 24px); box-sizing: border-box;
                            padding: 16px 20px; border-bottom: 1px solid #e0e0e0; background-color: #fafafa;
                            font-weight: 700; font-size: 18px; color: #333; position: sticky; top: 0; z-index: 2;
                            box-shadow: 0 1px 0 rgba(0,0,0,0.04);
                        }

                        /* Product Cards overrides */
                        .builder-product-card { flex-direction: column; align-items: stretch !important; padding: 12px !important; gap: 12px !important; }
                        .builder-card-image { width: 80px !important; height: 80px !important; align-self: center; }
                        
                        /* Product title - reduce font size and add line clamping */
                        .builder-product-card h3 { font-size: 13px !important; line-height: 1.3 !important; margin-bottom: 8px !important; 
                            display: -webkit-box !important; -webkit-line-clamp: 2 !important; -webkit-box-orient: vertical !important; 
                            overflow: hidden !important; text-overflow: ellipsis !important; }
                        
                        /* Specs/tags - reduce font size and padding */
                        .builder-product-card span[style*="backgroundColor: #f9fafb"] { 
                            font-size: 10px !important; padding: 2px 6px !important; }
                        
                        /* Price - increase font size slightly (target the specific product price div) */
                        .builder-product-card > div:nth-child(2) > div:last-child > div:first-child > div { 
                            font-size: 16px !important; }
                        
                        /* Stock info - increase font size slightly */
                        .builder-product-card > div:nth-child(2) > div:last-child > div:nth-child(2) > div:last-child { 
                            font-size: 12px !important; }
                        
                        /* Select/Deselect button - reduce font size and min-width */
                        .builder-product-card > div:nth-child(2) > div:last-child > div:nth-child(2) > button { 
                            font-size: 12px !important; padding: 8px 16px !important; min-width: 90px !important; }
                        
                        /* Bottom section - stack vertically with relative positioning */
                        .builder-product-card > div:nth-child(2) > div:last-child { 
                            flex-direction: column !important; align-items: stretch !important; gap: 8px !important; 
                            position: relative !important; }
                        
                        /* Stock+button container - make it just the stock text (row 1) */
                        .builder-product-card > div:nth-child(2) > div:last-child > div:nth-child(2) {
                            flex-direction: column !important; align-items: flex-start !important; order: 1 !important; }
                        
                        /* Price div - make it a flex row (row 2) with proper spacing */
                        .builder-product-card > div:nth-child(2) > div:last-child > div:first-child { 
                            display: flex !important; align-items: center !important; justify-content: space-between !important; 
                            order: 2 !important; padding-right: 100px !important; }
                        
                        /* Move button to align with price row using absolute positioning from bottom */
                        .builder-product-card > div:nth-child(2) > div:last-child > div:nth-child(2) > button {
                            position: absolute !important; right: 12px !important; bottom: 0px !important; }
                    }
                    @media (max-width: 480px) {
                        .builder-sidebar { grid-template-columns: 1fr; }
                    }
                `}</style>
            </Head>

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
                        marginBottom: "16px",
                        display: "flex",
                        gap: "12px",
                    }}
                >
                    {user && shareToken && (
                        <Link
                            href="/saved-builds"
                            style={{
                                padding: "17px 16px",
                                height: "54px",
                                boxSizing: "border-box",
                                backgroundColor: "#1f7a8c",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                textDecoration: "none",
                                transition: "all 0.15s ease-in-out",
                                fontFamily: "inherit",
                                fontSize: "14px",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                    "translateY(-2px)";
                                e.currentTarget.style.boxShadow =
                                    "0 6px 12px rgba(31, 122, 140, 0.4)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform =
                                    "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            <ArrowBackIcon style={{ fontSize: "18px" }} />
                            Back to Saved Builds
                        </Link>
                    )}

                    {!shareToken && !buildAuthorId && (
                        <button
                            onClick={() => {
                                setActiveProfile(null);
                                router.replace("/pc-builder", undefined, {
                                    shallow: true,
                                });
                            }}
                            style={{
                                padding: "17px 16px",
                                height: "54px",
                                boxSizing: "border-box",
                                backgroundColor: "#1f7a8c",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.15s ease-in-out",
                                fontFamily: "inherit",
                                fontSize: "14px",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform =
                                    "translateY(-2px)";
                                e.currentTarget.style.boxShadow =
                                    "0 6px 12px rgba(31, 122, 140, 0.4)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform =
                                    "translateY(0)";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            <ArrowBackIcon style={{ fontSize: "18px" }} />
                            Change Tier
                        </button>
                    )}
                </div>

                <React.Fragment>
                    {/* PILL TABS */}
                    <div
                        className="mobile-only-tabs"
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            marginBottom: "24px",
                        }}
                    >
                        <div
                            style={{
                                display: "inline-flex",
                                background: "#e0e4e8",
                                padding: "4px",
                                borderRadius: "12px",
                                gap: "4px",
                            }}
                        >
                            <button
                                onClick={() => setActiveTab("edit")}
                                style={{
                                    padding: "8px 32px",
                                    background:
                                        activeTab === "edit"
                                            ? "#1f7a8c"
                                            : "transparent",
                                    color:
                                        activeTab === "edit" ? "#fff" : "#555",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    boxShadow:
                                        activeTab === "edit"
                                            ? "0 2px 4px rgba(0,0,0,0.1)"
                                            : "none",
                                }}
                            >
                                Components
                            </button>
                            <button
                                onClick={() => setActiveTab("overview")}
                                style={{
                                    padding: "8px 32px",
                                    background:
                                        activeTab === "overview"
                                            ? "#1f7a8c"
                                            : "transparent",
                                    color:
                                        activeTab === "overview"
                                            ? "#fff"
                                            : "#555",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    boxShadow:
                                        activeTab === "overview"
                                            ? "0 2px 4px rgba(0,0,0,0.1)"
                                            : "none",
                                }}
                            >
                                Overview
                            </button>
                        </div>
                    </div>

                    <div
                        className="builder-header-row"
                        style={{
                            paddingBottom: "16px",
                            color: "#333",
                            fontWeight: 700,
                            fontSize: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "16px",
                        }}
                    >
                        <div
                            className="mobile-header-title-container"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                flexWrap: "wrap",
                            }}
                        >
                            <span>System Builder</span>
                            <span
                                className="mobile-hide"
                                style={{ color: "#ccc" }}
                            >
                                |
                            </span>
                            <div
                                className="mobile-header-input-container"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                {(isModified || shareToken) && (
                                    <EditIcon
                                        fontSize="small"
                                        style={{
                                            color: "#aaa",
                                            cursor: "pointer",
                                        }}
                                        onClick={() =>
                                            buildNameInputRef.current?.focus()
                                        }
                                    />
                                )}
                                <input
                                    className="mobile-header-input"
                                    ref={buildNameInputRef}
                                    type="text"
                                    value={buildName}
                                    disabled={!isModified && !shareToken}
                                    onChange={(e) => {
                                        setBuildName(e.target.value);
                                        setIsModified(true);
                                    }}
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
                                        cursor: isModified ? "text" : "default",
                                        width: "100%",
                                        maxWidth: "400px",
                                        textOverflow: "ellipsis",
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                    }}
                                    onFocus={(e) => {
                                        if (isModified) {
                                            e.target.style.backgroundColor =
                                                "#fff";
                                            e.target.style.border =
                                                "1px solid #1f7a8c";
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (isModified) {
                                            e.target.style.backgroundColor =
                                                "transparent";
                                            e.target.style.border =
                                                "1px solid transparent";
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div
                            className="desktop-action-btns"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                marginLeft: "auto",
                            }}
                        >
                            {renderActionButtons(false)}
                        </div>
                    </div>

                    {/* BUDGET TRACKER */}
                    <div
                        className={
                            activeTab === "overview"
                                ? "responsive-budget-visible"
                                : "responsive-budget-hidden"
                        }
                    >
                        <div
                            style={{
                                position: "sticky",
                                top: "var(--brand-height, 73px)",
                                zIndex: 100,
                                backgroundColor: "#f4f4f6", // Match main bg
                                paddingBottom: "8px", // A little padding below
                                paddingTop: "8px",
                                margin: "0 -24px", // Span edge to edge if needed, or keep to normal. Let's pad left/right
                                paddingLeft: "24px",
                                paddingRight: "24px",
                            }}
                        >
                            {activeProfile && (
                                <BudgetTracker
                                    selectedComponents={selectedComponents}
                                    targetBudget={activeProfile.targetBudget}
                                    activeProfile={activeProfile}
                                    setActiveCategory={setActiveCategory}
                                    onUpdateBudget={handleUpdateTargetBudget}
                                />
                            )}
                        </div>
                    </div>

                    {validationMessages.length > 0 && (
                        <div
                            className={`compatibility-warnings-container ${activeTab === "overview" ? "responsive-sidebar-hidden" : ""}`}
                            style={{ marginTop: "24px", marginBottom: "24px" }}
                        >
                            <style>{`
                            /* Default desktop view: snackbars visible, stepper hidden */
                            .desktop-alerts { display: flex; flex-direction: column; gap: 8px; }
                            .mobile-stepper-view { display: none; }
                            
                            @media (max-width: 900px) {
                                /* On mobile: snackbars hidden, stepper visible */
                                .desktop-alerts { display: none !important; }
                                .mobile-stepper-view { display: flex; flex-direction: column; gap: 12px; }
                            }
                        `}</style>

                            {/* Desktop Alerts (Snackbars) */}
                            <div className="desktop-alerts">
                                {validationMessages.map((msg, idx) => {
                                    const isError = msg.type === "error";
                                    const isWarning = msg.type === "warning";
                                    const isSuccess = msg.type === "success";

                                    let Icon = InfoIcon;
                                    let bgColor = "#e3f2fd";
                                    let borderColor = "#90caf9";
                                    let textColor = "#0277bd";

                                    if (isError) {
                                        Icon = ReportProblemIcon;
                                        bgColor = "#ffebee"; // red-ish
                                        borderColor = "#ff8a80";
                                        textColor = "#c62828";
                                    } else if (isWarning) {
                                        Icon = ReportProblemIcon;
                                        bgColor = "#fff3e0"; // orange-ish
                                        borderColor = "#ffb74d";
                                        textColor = "#e65100";
                                    } else if (isSuccess) {
                                        Icon = CheckCircleIcon;
                                        bgColor = "#e8f5e9";
                                        borderColor = "#81c784";
                                        textColor = "#2e7d32";
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                padding: "12px 16px",
                                                backgroundColor: bgColor,
                                                border: `1px solid ${borderColor}`,
                                                borderRadius: "8px",
                                                color: textColor,
                                                fontSize: "15px",
                                                fontWeight: 500,
                                            }}
                                        >
                                            <Icon fontSize="small" />
                                            {msg.message}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Mobile Stepper View */}
                            <div className="mobile-stepper-view">
                                {/* Health Stepper Bar */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "8px",
                                        alignItems: "flex-end",
                                        justifyContent: "space-between",
                                        width: "100%",
                                        flexWrap: "wrap",
                                        paddingBottom: "4px",
                                    }}
                                >
                                    {validationMessages.map((msg, idx) => {
                                        const lower = msg.message.toLowerCase();
                                        let shortLabel = "Status";
                                        if (
                                            lower.includes("socket") ||
                                            lower.includes("brand")
                                        )
                                            shortLabel = "Socket";
                                        else if (
                                            lower.includes("memory") ||
                                            lower.includes("ram") ||
                                            lower.includes("slots")
                                        )
                                            shortLabel = "Memory";
                                        else if (
                                            lower.includes("case") ||
                                            lower.includes("form factor") ||
                                            lower.includes("length") ||
                                            lower.includes("fits")
                                        )
                                            shortLabel = "Case Fit";
                                        else if (
                                            lower.includes("power") ||
                                            lower.includes("wattage") ||
                                            lower.includes("psu")
                                        )
                                            shortLabel = "Power";
                                        else if (
                                            lower.includes("cooler") ||
                                            lower.includes("cooling")
                                        )
                                            shortLabel = "Cooling";

                                        const isError = msg.type === "error";
                                        const isWarning =
                                            msg.type === "warning";
                                        const isSuccess =
                                            msg.type === "success";

                                        let barColor = "#e0e0e0";
                                        let dotColor = "transparent";
                                        let textColor = "#666";

                                        if (isError) {
                                            barColor = "#ef4444"; // red
                                            dotColor = "#ef4444";
                                            textColor = "#ef4444";
                                        } else if (isWarning) {
                                            barColor = "#f59e0b"; // yellow
                                            dotColor = "#f59e0b";
                                            textColor = "#f59e0b";
                                        } else if (isSuccess) {
                                            barColor = "#22c55e"; // green
                                            dotColor = "#22c55e";
                                            textColor = "#15803d";
                                        }

                                        return (
                                            <div
                                                key={`step-${idx}`}
                                                style={{
                                                    flex: "1 1 0",
                                                    minWidth: "18%", // allow wrap if more than 5
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: "11px",
                                                        fontWeight: 600,
                                                        color: textColor,
                                                        whiteSpace: "nowrap",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {shortLabel}
                                                </span>
                                                <div
                                                    style={{
                                                        width: "4px",
                                                        height: "4px",
                                                        borderRadius: "50%",
                                                        backgroundColor:
                                                            dotColor,
                                                        marginBottom: "2px",
                                                    }}
                                                ></div>
                                                <div
                                                    style={{
                                                        width: "100%",
                                                        height: "6px",
                                                        backgroundColor:
                                                            barColor,
                                                        borderRadius: "4px",
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Only show messages for Errors and Warnings on Mobile */}
                                {validationMessages.filter(
                                    (msg) =>
                                        msg.type === "error" ||
                                        msg.type === "warning",
                                ).length > 0 && (
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "6px",
                                        }}
                                    >
                                        {validationMessages
                                            .filter(
                                                (msg) =>
                                                    msg.type === "error" ||
                                                    msg.type === "warning",
                                            )
                                            .map((msg, idx) => {
                                                const isError =
                                                    msg.type === "error";

                                                const bgColor = isError
                                                    ? "#ffebee"
                                                    : "#fff3e0";
                                                const borderColor = isError
                                                    ? "#ff8a80"
                                                    : "#ffb74d";
                                                const textColor = isError
                                                    ? "#c62828"
                                                    : "#e65100";
                                                const Icon = isError
                                                    ? ReportProblemIcon
                                                    : ReportProblemIcon;

                                                return (
                                                    <div
                                                        key={`err-${idx}`}
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "8px",
                                                            padding: "8px 12px",
                                                            backgroundColor:
                                                                bgColor,
                                                            border: `1px solid ${borderColor}`,
                                                            borderRadius: "6px",
                                                            color: textColor,
                                                            fontSize: "13px",
                                                            fontWeight: 500,
                                                        }}
                                                    >
                                                        <Icon
                                                            style={{
                                                                fontSize:
                                                                    "16px",
                                                            }}
                                                        />
                                                        <span
                                                            style={{
                                                                lineHeight:
                                                                    "1.3",
                                                            }}
                                                        >
                                                            {msg.message}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div
                        className={`mobile-drawer-overlay ${isCategoryDrawerOpen || isFilterDrawerOpen ? "drawer-open" : ""}`}
                        onClick={() => {
                            setIsCategoryDrawerOpen(false);
                            setIsFilterDrawerOpen(false);
                        }}
                    />

                    <div
                        id="part-picker"
                        className="builder-layout-row"
                        style={{}}
                    >
                        {/* Left Sidebar - Categories */}
                        <div
                            className={`builder-sidebar ${activeTab === "overview" ? "responsive-sidebar-hidden" : ""} ${isCategoryDrawerOpen ? "drawer-open" : ""}`}
                            style={{
                                backgroundColor: "transparent",
                                margin: 0,
                            }}
                        >
                            <div className="mobile-only-tabs mobile-drawer-header category-drawer-header">
                                <span>Select a Category</span>
                                <CloseIcon
                                    style={{
                                        cursor: "pointer",
                                        color: "rgba(0,0,0,0.54)",
                                    }}
                                    onClick={() =>
                                        setIsCategoryDrawerOpen(false)
                                    }
                                />
                            </div>
                            {CATEGORIES.map((cat) => {
                                const isSelected = activeCategory === cat.id;
                                const selectedItem = selectedComponents[cat.id];
                                const IconComponent =
                                    CategoryIconMap[cat.id] || ComputerIcon;
                                const customImage = CategoryImageMap[cat.id];

                                return (
                                    <div
                                        key={cat.id}
                                        onClick={() => {
                                            setActiveCategory(cat.id);
                                            setIsCategoryDrawerOpen(false);
                                        }}
                                        className={
                                            isSelected ? "active-cat" : ""
                                        }
                                        style={{
                                            flexShrink: 0,
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
                                                <img
                                                    src={customImage}
                                                    alt={cat.name}
                                                    style={{
                                                        width: 28,
                                                        height: 28,
                                                    }}
                                                />
                                            ) : (
                                                <IconComponent
                                                    style={{
                                                        width: 24,
                                                        height: 24,
                                                        fill: "currentColor",
                                                    }}
                                                />
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
                                                            whiteSpace:
                                                                "nowrap",
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
                                                        ).toLocaleString(
                                                            "en-ZA",
                                                            {
                                                                minimumFractionDigits: 0,
                                                            },
                                                        )}
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

                        {/* Right column: mobile toolbar sits above the white catalog card (decoupled) */}
                        <div className="builder-catalog-column">
                            {activeTab === "edit" && (
                                <div className="mobile-sticky-catalog-header">
                                    <div
                                        className="mobile-catalog-cat-trigger"
                                        onClick={() =>
                                            setIsCategoryDrawerOpen(true)
                                        }
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                e.preventDefault();
                                                setIsCategoryDrawerOpen(true);
                                            }
                                        }}
                                    >
                                        <span className="mobile-catalog-cat-name">
                                            {
                                                CATEGORIES.find(
                                                    (c) =>
                                                        c.id === activeCategory,
                                                )?.name
                                            }
                                        </span>
                                        <span
                                            className="mobile-catalog-count-pill"
                                            style={{
                                                backgroundColor: "#e2e8f0",
                                                padding: "2px 8px",
                                                borderRadius: "12px",
                                                fontSize: "12px",
                                                color: "#555",
                                                fontWeight: 600,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {activeProducts.length}
                                        </span>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#1f7a8c"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ flexShrink: 0 }}
                                        >
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </div>
                                    <div
                                        className="mobile-catalog-filter-trigger"
                                        onClick={() =>
                                            setIsFilterDrawerOpen(true)
                                        }
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                            ) {
                                                e.preventDefault();
                                                setIsFilterDrawerOpen(true);
                                            }
                                        }}
                                    >
                                        <span style={{ flexShrink: 0 }}>
                                            Filtering
                                        </span>
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#1f7a8c"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{ flexShrink: 0 }}
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
                                </div>
                            )}

                            {/* Right Pane - Product Selection */}
                            <div
                                className={`builder-catalog ${activeTab === "edit" ? "responsive-catalog-visible" : "responsive-catalog-hidden"}`}
                                style={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                }}
                            >
                                {/* Right Drawer Filters (Mobile) */}
                                <div
                                    className={`mobile-filter-drawer ${isFilterDrawerOpen ? "drawer-open" : ""}`}
                                >
                                    <div className="mobile-only-tabs mobile-drawer-header">
                                        <span>Filtering</span>
                                        <CloseIcon
                                            style={{
                                                cursor: "pointer",
                                                color: "rgba(0,0,0,0.54)",
                                            }}
                                            onClick={() =>
                                                setIsFilterDrawerOpen(false)
                                            }
                                        />
                                    </div>

                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "24px",
                                            marginTop: "16px",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    fontWeight: 700,
                                                    marginBottom: "8px",
                                                    color: "#555",
                                                }}
                                            >
                                                Sort By:
                                            </div>
                                            <select
                                                value={sortOrder}
                                                onChange={(e) =>
                                                    setSortOrder(e.target.value)
                                                }
                                                style={{
                                                    padding: "12px 14px",
                                                    border: "1px solid #e0e0e0",
                                                    borderRadius: "8px",
                                                    fontSize: "16px",
                                                    backgroundColor: "#fff",
                                                    color: "#333",
                                                    outline: "none",
                                                    width: "100%",
                                                    boxSizing: "border-box",
                                                }}
                                            >
                                                <option value="recommended">
                                                    Most popular
                                                </option>
                                                <option value="price_asc">
                                                    Price: Low to High
                                                </option>
                                                <option value="price_desc">
                                                    Price: High to Low
                                                </option>
                                            </select>
                                        </div>

                                        <div>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    fontWeight: 700,
                                                    marginBottom: "8px",
                                                    color: "#555",
                                                }}
                                            >
                                                Quick Filter:
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Quick Filter"
                                                value={searchQuery}
                                                onChange={(e) =>
                                                    setSearchQuery(
                                                        e.target.value,
                                                    )
                                                }
                                                style={{
                                                    padding: "12px 14px",
                                                    border: "1px solid #e0e0e0",
                                                    borderRadius: "8px",
                                                    fontSize: "16px",
                                                    width: "100%",
                                                    outline: "none",
                                                    backgroundColor: "#fff",
                                                    color: "#333",
                                                    boxSizing: "border-box",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Header */}
                                <div
                                    className="desktop-catalog-header"
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
                                        <h2
                                            style={{
                                                fontSize: "18px",
                                                fontWeight: 700,
                                                margin: 0,
                                            }}
                                        >
                                            {
                                                CATEGORIES.find(
                                                    (c) =>
                                                        c.id === activeCategory,
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
                                        className="builder-filters-row"
                                        style={{
                                            display: "flex",
                                            gap: "12px",
                                            alignItems: "center",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        <input
                                            type="text"
                                            placeholder="Quick Filter"
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(e.target.value)
                                            }
                                            className="builder-filter-input"
                                            style={{
                                                padding: "8px 14px",
                                                border: "1px solid #ccc",
                                                borderRadius: "5px",
                                                fontSize: "13px",
                                                width: "200px",
                                                maxWidth: "100%",
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
                                            value={sortOrder}
                                            onChange={(e) =>
                                                setSortOrder(e.target.value)
                                            }
                                            style={{
                                                padding: "8px 14px",
                                                border: "1px solid #ccc",
                                                borderRadius: "5px",
                                                fontSize: "13px",
                                                backgroundColor: "#fff",
                                                outline: "none",
                                            }}
                                        >
                                            <option value="recommended">
                                                Recommended
                                            </option>
                                            <option value="price_asc">
                                                Price: Low to High
                                            </option>
                                            <option value="price_desc">
                                                Price: High to Low
                                            </option>
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
                                    ) : sortedActiveProducts.length > 0 ? (
                                        <AnimatePresence mode="popLayout">
                                            {sortedActiveProducts.map(
                                                (product: any) => {
                                                    const compatError =
                                                        !selectedComponents[
                                                            activeCategory
                                                        ]
                                                            ? getComponentCompatibility(
                                                                  activeCategory,
                                                                  product,
                                                                  {
                                                                      cpu: selectedComponents[
                                                                          "cpus"
                                                                      ],
                                                                      motherboard:
                                                                          selectedComponents[
                                                                              "motherboards"
                                                                          ],
                                                                      ram: selectedComponents[
                                                                          "ram"
                                                                      ],
                                                                      gpu: selectedComponents[
                                                                          "gpus"
                                                                      ],
                                                                      psu: selectedComponents[
                                                                          "psus"
                                                                      ],
                                                                      case: selectedComponents[
                                                                          "cases"
                                                                      ],
                                                                      system_cooling:
                                                                          selectedComponents[
                                                                              "coolers"
                                                                          ],
                                                                  },
                                                              )
                                                            : null;

                                                    const isItemActive =
                                                        selectedComponents[
                                                            activeCategory
                                                        ]?.variant_id ===
                                                        product.variant_id;
                                                    const specs =
                                                        getSpecs(product);

                                                    return (
                                                        <motion.div
                                                            layout
                                                            initial={{
                                                                opacity: 0,
                                                                y: 10,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                y: 0,
                                                            }}
                                                            exit={{
                                                                opacity: 0,
                                                                scale: 0.9,
                                                            }}
                                                            transition={{
                                                                type: "spring",
                                                                stiffness: 300,
                                                                damping: 30,
                                                            }}
                                                            key={
                                                                product.variant_id
                                                            }
                                                            className="builder-product-card"
                                                            style={{
                                                                display: "flex",
                                                                flexWrap:
                                                                    "wrap",
                                                                padding: "24px",
                                                                border: isItemActive
                                                                    ? "1px solid #1f7a8c"
                                                                    : "1px solid #eaeaea",
                                                                borderRadius:
                                                                    "8px",
                                                                gap: "24px",
                                                                alignItems:
                                                                    "stretch",
                                                                backgroundColor:
                                                                    isItemActive
                                                                        ? "#fcfdfd"
                                                                        : "#fff",
                                                                boxShadow:
                                                                    isItemActive
                                                                        ? "0 4px 12px rgba(31,122,140,0.08)"
                                                                        : "0 2px 8px rgba(0,0,0,0.02)",
                                                            }}
                                                        >
                                                            <div
                                                                className="builder-card-image"
                                                                style={{
                                                                    width: "140px",
                                                                    height: "140px",
                                                                    flexShrink: 0,
                                                                    backgroundColor:
                                                                        "#fff",
                                                                    borderRadius:
                                                                        "4px",
                                                                    border: "1px solid #eee",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    justifyContent:
                                                                        "center",
                                                                }}
                                                            >
                                                                {product.thumbnail ? (
                                                                    <img
                                                                        src={
                                                                            product.thumbnail
                                                                        }
                                                                        alt={
                                                                            product.title
                                                                        }
                                                                        style={{
                                                                            maxWidth:
                                                                                "85%",
                                                                            maxHeight:
                                                                                "85%",
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
                                                                    display:
                                                                        "flex",
                                                                    flexDirection:
                                                                        "column",
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
                                                                            onMouseOver={(
                                                                                e,
                                                                            ) =>
                                                                                (e.currentTarget.style.color =
                                                                                    "#1f7a8c")
                                                                            }
                                                                            onMouseOut={(
                                                                                e,
                                                                            ) =>
                                                                                (e.currentTarget.style.color =
                                                                                    "#111")
                                                                            }
                                                                            title={`View specs for ${product.title} in new tab`}
                                                                        >
                                                                            {
                                                                                product.title
                                                                            }
                                                                        </h3>
                                                                    </a>

                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            flexWrap:
                                                                                "wrap",
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
                                                                                    key={
                                                                                        idx
                                                                                    }
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
                                                                                    {
                                                                                        spec
                                                                                    }
                                                                                </span>
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "flex-end",
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
                                                                                    100 ||
                                                                                0
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
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: "24px",
                                                                        }}
                                                                    >
                                                                        {compatError &&
                                                                            !isItemActive && (
                                                                                <div
                                                                                    style={{
                                                                                        color: "#c62828",
                                                                                        fontSize:
                                                                                            "13px",
                                                                                        display:
                                                                                            "flex",
                                                                                        alignItems:
                                                                                            "center",
                                                                                        gap: "4px",
                                                                                        maxWidth:
                                                                                            "200px",
                                                                                    }}
                                                                                >
                                                                                    <ReportProblemIcon
                                                                                        style={{
                                                                                            fontSize:
                                                                                                "16px",
                                                                                        }}
                                                                                    />
                                                                                    {
                                                                                        compatError.message
                                                                                    }
                                                                                </div>
                                                                            )}
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
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                gap: "4px",
                                                                                fontWeight: 600,
                                                                            }}
                                                                        >
                                                                            {product
                                                                                .stock
                                                                                ?.status ===
                                                                            "in_stock"
                                                                                ? "In stock"
                                                                                : product
                                                                                        .stock
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
                                                        </motion.div>
                                                    );
                                                },
                                            )}
                                        </AnimatePresence>
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
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                ></circle>
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

                        {/* Allocation Modal */}
                        <AllocationModal
                            isOpen={isModalOpen}
                            onClose={() => setIsModalOpen(false)}
                            activeProfile={activeProfile}
                            selectedComponents={selectedComponents}
                        />
                    </div>
                </React.Fragment>
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
                            flexDirection: "column",
                            alignItems: "flex-start",
                            gap: "2px",
                        }}
                    >
                        <span
                            className="mobile-total-label"
                            style={{
                                fontSize: "16px",
                                color: "#555",
                                fontWeight: 600,
                            }}
                        >
                            Total
                        </span>
                        <span
                            className="mobile-total-price"
                            style={{
                                fontSize: "28px",
                                fontWeight: 800,
                                color: "#1f7a8c",
                            }}
                        >
                            R{" "}
                            {totalPrice.toLocaleString("en-ZA", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
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
                        <button
                            className="mobile-add-btn"
                            style={{
                                padding: "17px 16px",
                                height: "54px",
                                boxSizing: "border-box",
                                backgroundColor: "#1f7a8c",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                fontWeight: 600,
                                cursor:
                                    totalPrice > 0 ? "pointer" : "not-allowed",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                transition: "all 0.15s ease-in-out",
                                fontFamily: "inherit",
                                fontSize: "14px",
                                opacity: totalPrice > 0 ? 1 : 0.5,
                            }}
                            onMouseEnter={(e) => {
                                if (totalPrice > 0) {
                                    e.currentTarget.style.transform =
                                        "translateY(-2px)";
                                    e.currentTarget.style.boxShadow =
                                        "0 6px 12px rgba(31, 122, 140, 0.4)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (totalPrice > 0) {
                                    e.currentTarget.style.transform =
                                        "translateY(0)";
                                    e.currentTarget.style.boxShadow = "none";
                                }
                            }}
                            onClick={handleAddAllToCart}
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
                            Add Build to Cart
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Floating Action Button */}
            {!hideFab && (
                <div className="fab-wrapper">
                    <div
                        className={`fab-overlay ${isFabOpen ? "open" : ""}`}
                        onClick={() => setIsFabOpen(false)}
                    />
                    <div className="fab-container">
                        <div className={`fab-menu ${isFabOpen ? "open" : ""}`}>
                            {renderActionButtons(true)}
                        </div>
                        <button
                            className="fab-trigger"
                            onClick={() => setIsFabOpen(!isFabOpen)}
                            aria-label="Toggle Actions"
                        >
                            {isFabOpen ? (
                                <CloseIcon style={{ fontSize: "24px" }} />
                            ) : (
                                <MoreVertIcon style={{ fontSize: "24px" }} />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
