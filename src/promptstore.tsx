import { Form, Detail, LocalStorage, Action, ActionPanel, Clipboard, Icon, popToRoot, showToast, Toast, KeyEquivalent } from "@raycast/api";
import { useEffect, useState } from "react";

const DEFAULT_ACTION_KEY = "defaultAction";
const PROMPT_KEY = "prompt";



export default function Command() {
    const [prompt, setPrompt] = useState<string | null>(null);
    const [cutAsDefault, setCutAsDefault] = useState<boolean>(true);


    const [promptsCount, setPromptsCount] = useState<number>(1);






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
            const savedPrompt = await LocalStorage.getItem(PROMPT_KEY);
            setPrompt(typeof savedPrompt === "string" ? savedPrompt : "");



            let count = 1;
            for (count; true; count++) {
                const otherPrompt = await LocalStorage.getItem(PROMPT_KEY + count);
                if (typeof otherPrompt !== "string") {
                    break;
                }
                count++;
            }

            console.log("count", count);


            /*
            Prompt strategy

            continously keep loading the next prompt till they are all gone!
            */



            const savedCutAsDefault = await LocalStorage.getItem(DEFAULT_ACTION_KEY);

            switch (savedCutAsDefault) {
                case 1:
                    setCutAsDefault(true);
                    break;
                case 0:
                    setCutAsDefault(false);
                    break;
                default:
                    await LocalStorage.setItem(DEFAULT_ACTION_KEY, 1);
                    break;
            }
        }
        load();
    }, []);

    if (prompt === null) {
        return <Detail markdown="Loading..." />;
    }



    async function copy() {
        await Clipboard.copy(prompt ?? "");
        await copiedToastAndClose();
    }

    async function cut() {
        await Clipboard.copy(prompt ?? "");
        await LocalStorage.removeItem(PROMPT_KEY);
        await copiedToastAndClose();
    }



    return (
        <Form
            actions={
                <ActionPanel>
                    <Action
                        title={cutAsDefault ? "Cut to clipboard" : "Copy to clipboard"}
                        icon={Icon.Clipboard}
                        shortcut={{ modifiers: ["cmd"], key: "return" }}
                        onAction={async () => {
                            cutAsDefault ? await cut() : await copy();
                        }}
                    />



                    <Action
                        title="Add"
                        icon={Icon.Plus}
                        shortcut={{ modifiers: ["cmd"], key: "n" }}
                        onAction={async () => {
                            setPromptsCount(promptsCount + 1);
                        }}
                    />

                    {
                        Array.from({ length: promptsCount - 1 }, (_, index) => {
                            return <Action
                                key={`prompt-action-${index}`}
                                title={(index + 2).toString()}
                                icon={Icon.Switch}
                                shortcut={{ modifiers: ["cmd"], key: (index + 2).toString() as KeyEquivalent }}
                                onAction={async () => {
                                    setPromptsCount(index + 1);
                                }}
                            />
                        })
                    }



                    <Action
                        title={cutAsDefault ? "Copy to clipboard" : "Cut to clipboard"}
                        icon={Icon.Duplicate}
                        shortcut={{ modifiers: ["cmd"], key: cutAsDefault ? "c" : "x" }}
                        onAction={async () => {
                            cutAsDefault ? await copy() : await cut();
                        }}
                    />


                    <Action
                        title="Clear"
                        icon={Icon.Trash}
                        shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                        onAction={async () => {
                            setPrompt("");
                            await LocalStorage.removeItem(PROMPT_KEY);
                        }}
                    />

                    <Action
                        title={`${cutAsDefault ? "COPY" : "CUT"} as default`}
                        icon={Icon.Gear}
                        onAction={async () => {
                            setCutAsDefault(!cutAsDefault);
                            await LocalStorage.setItem(DEFAULT_ACTION_KEY, !cutAsDefault);
                        }}
                    />



                </ActionPanel>
            }
        >
            <Form.TextArea
                id={PROMPT_KEY}
                value={prompt}
                onChange={async (value) => {
                    setPrompt(value);
                    await LocalStorage.setItem(PROMPT_KEY, value);
                }}
            />
            <Form.Description text={`characters: ${prompt?.length}`} />
        </Form>
    );
}