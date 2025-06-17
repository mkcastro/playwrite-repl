export function getHelpers(getPage) {
    return {
        // Screenshot helper
        ss: async () => {
            const path = `screenshot-${Date.now()}.png`;
            await getPage().screenshot({ path });
            console.log(`📸 Saved screenshot to ${path}`);
        },
        // Text helper
        text: async (selector) => {
            return await getPage().textContent(selector);
        }
    };
}
