const Order = require("./assignment2Order");
const { validSize, validFilling } = require("./validValues");

const OrderState = Object.freeze({
    WELCOMING: Symbol("welcoming"),
    SIZE: Symbol("size"),
    SECOND_ITEM: Symbol("second_item"),
    SECOND_ITEM_COUNT: Symbol("second_item_count"),
    THIRD_ITEM: Symbol("third_item"),
    THIRD_ITEM_SPEC: Symbol("third_item_spec"),
    FILLING: Symbol("Filling"),
    DRINKS: Symbol("drinks"),
    FRIES: Symbol("fries"),
});


module.exports = class ShwarmaOrder extends Order {
    constructor() {
        super();
        this.stateCur = OrderState.WELCOMING;
        this.sSize = "";
        this.sSecondItem = "Garlic Bread";
        this.sSecondItemCount = 0;
        this.sThirdItem = "Falafel";
        this.sThirdItemSpec = "";
        this.sFilling = "";
        this.sDrinks = "";
        this.sFries = "";
        this.sTotal = 0.0;
        this.sItem = "Shawarama";
    }
    handleInput(sInput) {
        let aReturn = [];
        switch (this.stateCur) {
            case OrderState.WELCOMING:
                this.stateCur = OrderState.SIZE;
                aReturn.push("Welcome to Rich's Shawarma place.");
                aReturn.push("What size would you like?");
                break;
            case OrderState.SIZE:
                if (!validSize.includes(sInput.toLowerCase())) {                    
                    aReturn.push(`Please enter a valid size.\n (${validSize.toString()}) `);
                    break;
                }
                this.stateCur = OrderState.FILLING
                this.sSize = sInput;
                if (this.sSize == "large") { this.sTotal += 20; }
                if (this.sSize == "medium") { this.sTotal += 15; }
                if (this.sSize == "small") { this.sTotal += 10; }
                aReturn.push("What filling would you like?");
                break;
            case OrderState.FILLING:
                if (!validFilling.includes(sInput.toLowerCase())) {                    
                    aReturn.push(`Please enter one of the available fillings.\n (${validFilling.toString()}) `);
                    break;
                }
                this.stateCur = OrderState.SECOND_ITEM
                this.sFilling = sInput;
                this.sTotal += 10;
                aReturn.push(`Would you like ${this.sSecondItem} with that ?`);
                break;
            case OrderState.SECOND_ITEM:
                if (sInput.toLowerCase() != "no") {
                    this.stateCur = OrderState.SECOND_ITEM_COUNT
                    aReturn.push(`How many ${this.sSecondItem} would you like ?`);
                } else {
                    this.stateCur = OrderState.THIRD_ITEM;
                    aReturn.push(`Would you like ${this.sThirdItem} with that ?`);
                }
                break;
            case OrderState.SECOND_ITEM_COUNT:
                this.stateCur = OrderState.THIRD_ITEM;
                aReturn.push(`Would you like ${this.sThirdItem} with that ?`);
                this.sSecondItemCount = parseInt(sInput);
                this.sTotal += this.sSecondItemCount * 5;
                break;
            case OrderState.THIRD_ITEM:
                if (sInput.toLowerCase() != "no") {
                    this.stateCur = OrderState.THIRD_ITEM_SPEC
                    aReturn.push(`How would you like your ${this.sThirdItem}, spicy or mild ?`);
                } else {
                    this.stateCur = OrderState.DRINKS;
                    aReturn.push(`What drink would you like with that ?`);
                }
                break;
            case OrderState.THIRD_ITEM_SPEC:
                this.stateCur = OrderState.DRINKS;
                aReturn.push(`What drink would you like with that ?`);
                this.sThirdItemSpec = sInput;
                this.sTotal += 10;
                break;
            case OrderState.DRINKS:
                this.stateCur = OrderState.FRIES;
                aReturn.push(`Would you like fries with that ?`);
                if (sInput.toLowerCase() != "no") {
                    this.sDrinks = sInput;
                    this.sTotal += 3;
                }
                break;
            case OrderState.FRIES:
                this.isDone(true);
                if (sInput.toLowerCase() != "no") {
                    this.sFries = sInput;
                    this.sTotal += 5;
                }
                aReturn.push("Thank you for your order of");
                aReturn.push(`${this.sSize} ${this.sItem} with ${this.sFilling}`);
                if (this.sSecondItemCount > 0) {
                    aReturn.push(` ${this.sSecondItemCount} ${this.sSecondItem}s.`);
                }
                if (this.sThirdItemSpec > "") {
                    aReturn.push(` ${this.sThirdItemSpec} ${this.sThirdItem}s.`);
                }
                if (this.sDrinks) {
                    aReturn.push(`With ${this.sDrinks}`);
                }
                if (this.sFries) {
                    aReturn.push(`and fries.`);
                }
                aReturn.push(`Your total is $${this.sTotal}`);
                let d = new Date();
                d.setMinutes(d.getMinutes() + 20);
                aReturn.push(`Please pick it up at ${d.toTimeString()}`);
                break;
        }
        return aReturn;
    }
}