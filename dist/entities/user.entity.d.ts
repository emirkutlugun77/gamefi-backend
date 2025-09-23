export declare enum PlayerSide {
    DARK = "DARK",
    HOLY = "HOLY",
    NOT_CHOSEN = "NOT_CHOSEN"
}
export declare class User {
    id: number;
    publicKey: string;
    chosenSide: PlayerSide;
}
