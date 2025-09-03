import { Form, Detail, LocalStorage, Action, ActionPanel, Clipboard, Icon, popToRoot, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";

export default function Command() {
    const [prompt, setPrompt] = useState<string | null>(null);
    const [cutAsDefault, setCutAsDefault] = useState<boolean>(true);


    async function copiedToastAndClose() {
        await showToast({
            style: Toast.Style.Success,
            title: "Copied to clipboard",
            message: "Prompt copied"
        });
        popToRoot({ clearSearchBar: true })
    };


    useEffect(() => {
        async function load() {
            const savedPrompt = await LocalStorage.getItem("prompt");
            setPrompt(typeof savedPrompt === "string" ? savedPrompt : "");

            const savedCutAsDefault = await LocalStorage.getItem("defaultAction");

            if (typeof savedCutAsDefault === "boolean") {
                setCutAsDefault(savedCutAsDefault);
            }
        }
        load();
    }, []);

    if (prompt === null) {
        return <Detail markdown="Loading..." />;
    }

    return (
        <Form
            actions={
                <ActionPanel>
                    <Action.CopyToClipboard
                        title="Cut to clipboard"
                        icon={Icon.Clipboard}
                        shortcut={{ modifiers: ["cmd"], key: "return" }}
                        onCopy={async () => {
                            await LocalStorage.removeItem("prompt");
                            await copiedToastAndClose();
                        }}
                        content={prompt}
                    />


                    <Action
                        title="Copy to clipboard"
                        icon={Icon.Duplicate}
                        shortcut={{ modifiers: ["cmd"], key: "c" }}
                        onAction={async () => {
                            await Clipboard.copy(prompt);
                            await copiedToastAndClose();
                        }}
                    />


                    <Action
                        title="Clear"
                        icon={Icon.Trash}
                        shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                        onAction={async () => {
                            setPrompt("");
                            await LocalStorage.removeItem("prompt");
                        }}
                    />

                    <Action
                        title={`${cutAsDefault ? "COPY" : "CUT"} as default`}
                        icon={Icon.Gear}
                        onAction={async () => {
                            setCutAsDefault(!cutAsDefault);
                            await LocalStorage.setItem("defaultAction", cutAsDefault ? "COPY" : "CUT");
                        }}
                    />



                </ActionPanel>
            }
        >
            <Form.TextArea
                id="prompt"
                value={prompt}
                onChange={async (value) => {
                    setPrompt(value);
                    await LocalStorage.setItem("prompt", value);
                }}
            />
            <Form.Description text={`characters: ${prompt?.length}`} />
        </Form>
    );
}