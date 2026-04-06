import React from "react";
import Head from "next/head";
import Header from "../components/header/header";
import { Onboarding } from "../components/pcbuilder/Onboarding";
import { BuilderWorkspace } from "../components/pcbuilder/BuilderWorkspace";
import { BuilderProvider, useBuilder } from "../context/BuilderContext";

function BuilderApp() {
    const { activeProfile, setActiveProfile, setSelectedComponents, setBuildName, setIsModified } = useBuilder();

    const handleProfileSelect = (profile: any) => {
        setActiveProfile(profile);
        setSelectedComponents(profile.seed || {});
        setBuildName(profile.name === "Start from Scratch" ? "My Custom Build" : profile.name + " Build");
        setIsModified(profile.isCustom ? true : false);
    };

    if (activeProfile) {
        return <BuilderWorkspace />;
    }

    return (
        <main style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto", minHeight: "80vh" }}>
            <Onboarding onSelectProfile={handleProfileSelect} />
        </main>
    );
}

export default function PcBuilder() {
    return (
        <div>
            <Header />
            <Head>
                <title>PC Builder | Select a Tier</title>
            </Head>
            <BuilderProvider>
                <BuilderApp />
            </BuilderProvider>
        </div>
    );
}
