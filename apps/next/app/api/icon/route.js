import { renderToString } from "react-dom/server.browser";
import * as Icons from "lucide-react";

// react-doctor-disable-next-line react-doctor/server-auth-actions
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const iconName = searchParams.get("icon");

        if (!iconName || !Icons[iconName]) {
            return new Response('', { status: 404 });
        }

        const IconComponent = Icons[iconName];

        const size        = searchParams.get("size");
        const width       = searchParams.get("width");
        const height      = searchParams.get("height");
       // const strokeWidth = searchParams.get("strokeWidth");
        const fill        = searchParams.get("fill");

        const iconProps = {
            color: "white",
            ...(size        && { size:        Number(size) }),
            ...(width       && { width:       Number(width) }),
            ...(height      && { height:      Number(height) }),
         //   ...(strokeWidth && { strokeWidth: Number(strokeWidth) }),
            ...(fill        && { fill }),
        };

        const iconString = renderToString(<IconComponent {...iconProps} />);

        return new Response(iconString, {
            headers: {
                "Content-Type": "image/svg+xml",
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        console.error("Error rendering icon:", error);
        return new Response("Internal Server Error", { status: 500 });
    }
}