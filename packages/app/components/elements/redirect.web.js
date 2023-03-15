
export default function ElementRedirect({data}) {
    if (data?.uri) {
        document.location = data.uri;
    }
    return null;
}