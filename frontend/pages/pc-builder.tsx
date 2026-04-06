import React from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Onboarding } from "../components/pcbuilder/Onboarding";
import { BuilderProvider, useBuilder } from "../context/BuilderContext";

function BuilderLanding() {
    const router = useRouter();
    const { setActiveProfile, setSelectedComponents, setBuildName, setIsModified } = useBuilder();

    const handleProfileSelect = (profile: any) => {
        setActiveProfile(profile);
        setSelectedComponents(profile.seed || {});
        setBuildName(profile.name === "Start from Scratch" ? "My Custom Build" : profile.name + " Build");
        setIsModified(profile.isCustom ? true : false);
        router.push("/build/create");
    };

    return (
        <>
            <Head>
                <title>PC Builder | Select a Tier</title>
            </Head>
            <main style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto", minHeight: "80vh" }}>
                <Onboarding onSelectProfile={handleProfileSelect} />
            </main>
        </>
    );
}

export default function PcBuilder() {
    return (
        <BuilderProvider>
            <BuilderLanding />
        </BuilderProvider>
    );
}
