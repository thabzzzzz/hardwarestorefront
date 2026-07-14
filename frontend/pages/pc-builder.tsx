import React from "react";
import Head from "next/head";
import Header from "../components/header/header";
import { Onboarding } from "../components/pcbuilder/Onboarding";
import { BuilderWorkspace } from "../components/pcbuilder/BuilderWorkspace";
import { BuilderProvider, useBuilder } from "../context/BuilderContext";
import styles from "./pc-builder.module.css";

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
        <main className={styles.builderMain}>
            <Onboarding onSelectProfile={handleProfileSelect} />
        </main>
    );
}

export default function PcBuilder() {
    return (
        <div>
            <Header hideSearchOnMobile={true} />
            <Head>
                <title>PC Builder | Select a Tier</title>
            </Head>
            <BuilderProvider>
                <BuilderApp />
            </BuilderProvider>
        </div>
    );
}
