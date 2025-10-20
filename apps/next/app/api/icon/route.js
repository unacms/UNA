
import { renderToString } from "react-dom/server.browser";
//import * as Icons from 'lucide-react-native'
import * as Icons from "lucide-react";
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const iconName = searchParams.get("icon");
        
        if (!iconName || !Icons[iconName]) {
            return new Response(
                JSON.stringify({ icon: '' }),
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
    
            );
        }

        const IconComponent = Icons[searchParams.get('icon')];

        // Extract size and dimensions from query parameters
        const width = searchParams.get("width");
        const fill = searchParams.get("fill");
        const height = searchParams.get("height");
        const size = searchParams.get("size");
         const strokeWidth = searchParams.get('strokeWidth');

        // Dynamically set icon properties
        const iconProps = {
            color: "currentColor",
            ...(width && { width }),
            ...(fill && { fill }),
            ...(height && { height }),
            ...(size && { size }),
            ...(strokeWidth && { strokeWidth }),
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