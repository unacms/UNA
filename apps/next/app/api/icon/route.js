"use server";

import { renderToString } from "react-dom/server.browser";
import * as Icons from "@phosphor-icons/react/dist/ssr";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const iconName = searchParams.get("icon");

        if (!iconName || !Icons[iconName]) {
            return new Response("Icon not found", { status: 404 });
        }

        const IconComponent = Icons[iconName];

        // Extract size and dimensions from query parameters
        const width = searchParams.get("width");
        const height = searchParams.get("height");
        const size = searchParams.get("size");

        // Dynamically set icon properties
        const iconProps = {
            color: "currentColor",
            ...(width && { width }),
            ...(height && { height }),
            ...(size && { size }),
        };

        // Render the SVG component to a string
        const iconString = renderToString(<IconComponent {...iconProps} />);

        // Return the raw SVG with appropriate headers
        return new Response(
            JSON.stringify({ icon: iconString }),
            {
              headers: {
                "Content-Type": "application/json",
              },
            }

        );
    } catch (error) {
        console.error("Error rendering icon:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}