import { Form, Detail, LocalStorage, Action, ActionPanel, Clipboard, Icon, popToRoot, showToast, Toast, KeyEquivalent } from "@raycast/api";
import { useEffect, useState } from "react";

const DEFAULT_ACTION_KEY = "defaultAction";
const PROMPT_KEY = "prompt";
const PROMPT_SELECTED_KEY = "promptSelected";
const PROMPTS_COUNT_KEY = "promptsCount";



export default function Command() {
    const [prompt, setPrompt] = useState<string | null>(null);
    const [cutAsDefault, setCutAsDefault] = useState<boolean>(true);


    const [promptsCount, setPromptsCount] = useState<number>(1);
    const [promptSelected, setPromptSelected] = useState<number>(0);






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
            const promptSelectedAux = await LocalStorage.getItem(PROMPT_SELECTED_KEY);
            setPromptSelected(typeof promptSelectedAux === "number" ? promptSelectedAux : 0);


            const promptsCountAux = await LocalStorage.getItem(PROMPTS_COUNT_KEY);
            setPromptsCount(typeof promptsCountAux === "number" ? promptsCountAux : 1);


            const savedPrompt = await LocalStorage.getItem(PROMPT_KEY + promptSelected);
            console.log(PROMPT_KEY + promptSelected);
            setPrompt(typeof savedPrompt === "string" ? savedPrompt : "");



            // let count = 1;
            // for (count; true; count++) {
            //     const otherPrompt = await LocalStorage.getItem(PROMPT_KEY + count);
            //     if (typeof otherPrompt !== "string") {
            //         break;
            //     
            //     count++;
            // }

            // console.log("count", count);


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
        await LocalStorage.removeItem(PROMPT_KEY + promptSelected);
        await copiedToastAndClose();
        // more work
    }


    async function switchPrompt(index: number) {
        await LocalStorage.setItem(PROMPT_SELECTED_KEY, index);
        const promptAux = await LocalStorage.getItem(PROMPT_KEY + index);
        setPrompt(typeof promptAux === "string" ? promptAux : "");
        setPromptSelected(index);
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
                            await LocalStorage.setItem(PROMPTS_COUNT_KEY, promptsCount + 1);
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
                                    await switchPrompt(index + 1);
                                    // setPromptSelected(index + 1);
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
                            await LocalStorage.removeItem(PROMPT_KEY + promptSelected);
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
            {
                promptsCount > 1 && (
                    <Form.Description text={`${promptSelected + 1} of ${promptsCount}`} />
                )
            }

            <Form.TextArea
                id={"activePrompt"}
                value={prompt}
                onChange={async (value) => {
                    setPrompt(value);
                    await LocalStorage.setItem(PROMPT_KEY + promptSelected, value);
                }}
            />
            <Form.Description text={`characters: ${prompt?.length}`} />


        </Form>
    );
}