import { useRouter } from "expo-router";

export default function ElementRedirect({data}) {
    const router = useRouter();
    if (data?.uri) {
        if (data?.timeout)
            setTimeout(() => router.replace(data.uri), data.timeout);
        else
            router.replace(data.uri);
    }
    return null;
}