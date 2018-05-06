"use strict";
import {DB} from "./queryHelper";

export class MqttTopicMatch {
    static indexOf(searchIn: string, searchFor: string, ...otherStrings: string[]): number {
        let index: number = -1;

        if (searchIn) {
            index = searchIn.search(searchFor);
            if (index !== -1) {
                return index;
            }

            if (otherStrings[0]) {
                for (const item of otherStrings) {
                    if (index !== -1) return index;
                    else
                        index = item.search(searchFor);
                }
            }
        }

        return index;
    }

    static hasString(searchIn: string, searchFor: string, ...otherStrings: string[]): boolean {
        let stringIsPresent: boolean = false;

        if (searchIn) {
            if (searchIn.search(searchFor) !== -1) {
                stringIsPresent = true;
            }

            if (otherStrings[0]) {
                for (const item of otherStrings) {
                    if (stringIsPresent) break;
                    else {
                        if (item.search(searchFor) !== -1)
                            stringIsPresent = true;
                    }
                }
            }
        }

        return stringIsPresent;
    }
}