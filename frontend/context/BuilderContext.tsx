import React, { createContext, useContext, useState, ReactNode } from "react";

type BuilderContextType = {
    activeProfile: any;
    setActiveProfile: (profile: any) => void;
    activeCategory: string;
    setActiveCategory: (cat: string) => void;
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    isModified: boolean;
    setIsModified: (mod: boolean) => void;
    selectedComponents: Record<string, any>;
    setSelectedComponents: (components: Record<string, any>) => void;
    productsCache: Record<string, any[]>;
    setProductsCache: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
    loadingCategory: boolean;
    setLoadingCategory: (loading: boolean) => void;
    buildName: string;
    setBuildName: (name: string) => void;
    shareToken: string;
    setShareToken: (token: string) => void;
    isSaving: boolean;
    setIsSaving: (saving: boolean) => void;
    isLoadingBuild: boolean;
    setIsLoadingBuild: (loading: boolean) => void;
    buildAuthorId: number | null;
    setBuildAuthorId: (id: number | null) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    compatibilityMode: "strict" | "mixed";
    setCompatibilityMode: (mode: "strict" | "mixed") => void;
};

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export function BuilderProvider({ children }: { children: ReactNode }) {
    const [activeProfile, setActiveProfile] = useState<any>(null);
    const [activeCategory, setActiveCategory] = useState("cases");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModified, setIsModified] = useState(false);
    const [selectedComponents, setSelectedComponents] = useState<Record<string, any>>({});
    
    const [productsCache, setProductsCache] = useState<Record<string, any[]>>({});
    const [loadingCategory, setLoadingCategory] = useState(false);

    // Save feature state
    const [buildName, setBuildName] = useState("My Build 1");
    const [shareToken, setShareToken] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingBuild, setIsLoadingBuild] = useState(false);
    const [buildAuthorId, setBuildAuthorId] = useState<number | null>(null);

    // Filter/Search and Compatibility states (commonly nested in the builder)
    const [searchQuery, setSearchQuery] = useState("");
    const [compatibilityMode, setCompatibilityMode] = useState<"strict" | "mixed">("mixed");

    const [isHydrated, setIsHydrated] = useState(false);

    // DRAFT PERSISTENCE (auto-recover state before/after login)
    React.useEffect(() => {
        if (typeof window !== "undefined") {
            const savedDraft = sessionStorage.getItem("builder_draft");
            if (savedDraft) {
                try {
                    const data = JSON.parse(savedDraft);
                    if (data.activeProfile) setActiveProfile(data.activeProfile);
                    if (data.selectedComponents) setSelectedComponents(data.selectedComponents);
                    if (data.buildName) setBuildName(data.buildName);
                    if (data.shareToken) setShareToken(data.shareToken);
                    if (data.isModified) setIsModified(data.isModified);
                    if (data.buildAuthorId !== undefined) setBuildAuthorId(data.buildAuthorId);
                } catch (e) {
                    console.error("Failed to parse builder draft", e);
                }
            }
            setIsHydrated(true);
        }
    }, []);

    React.useEffect(() => {
        if (typeof window !== "undefined" && isHydrated) {
            const draft = {
                activeProfile,
                selectedComponents,
                buildName,
                shareToken,
                isModified,
                buildAuthorId
            };
            sessionStorage.setItem("builder_draft", JSON.stringify(draft));
        }
    }, [activeProfile, selectedComponents, buildName, shareToken, isModified, buildAuthorId, isHydrated]);

    return (
        <BuilderContext.Provider
            value={{
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
                compatibilityMode,
                setCompatibilityMode,
            }}
        >
            {children}
        </BuilderContext.Provider>
    );
}

export function useBuilder() {
    const context = useContext(BuilderContext);
    if (!context) {
        throw new Error("useBuilder must be used within a BuilderProvider");
    }
    return context;
}
