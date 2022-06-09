const { SinkContext } = require("twilio/lib/rest/events/v1/sink");
const Order = require("./Order");
const {
  validSize,
  validFilling,
  validDrinks,
  validSpec
} = require("./validValues");

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
  PAYMENT: Symbol("payment"),
});

module.exports = class ShwarmaOrder extends Order {
  constructor(sNumber, sUrl) {
    super(sNumber, sUrl);
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
        if (this.sSize == "large") {
          this.sTotal += 20;
        }
        if (this.sSize == "medium") {
          this.sTotal += 15;
        }
        if (this.sSize == "small") {
          this.sTotal += 10;
        }
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
        if (sInput.toLowerCase() == "yes") {
          this.stateCur = OrderState.SECOND_ITEM_COUNT
          aReturn.push(`How many ${this.sSecondItem} would you like ?`);
        } else if (sInput.toLowerCase() == "no") {
          this.stateCur = OrderState.THIRD_ITEM;
          aReturn.push(`Would you like ${this.sThirdItem} with that ?`);
        } else {
          aReturn.push(`Please enter yes/no.`);
        }
        break;
      case OrderState.SECOND_ITEM_COUNT:
        if (parseInt(sInput)) {
          this.stateCur = OrderState.THIRD_ITEM;
          aReturn.push(`Would you like ${this.sThirdItem} with that ?`);
          this.sSecondItemCount = parseInt(sInput);
          this.sTotal += this.sSecondItemCount * 5;
        } else {
          aReturn.push(`Please enter a valid number of ${this.sSecondItem}s`);
        }
        break;
      case OrderState.THIRD_ITEM:
        if (sInput.toLowerCase() == "yes") {
          this.stateCur = OrderState.THIRD_ITEM_SPEC
          aReturn.push(`How would you like your ${this.sThirdItem}, spicy or mild ?`);
        } else if (sInput.toLowerCase() == "no") {
          this.stateCur = OrderState.DRINKS;
          aReturn.push(`What drink would you like with that ?`);
        } else {
          aReturn.push("Please enter yes/no.");
        }
        break;
      case OrderState.THIRD_ITEM_SPEC:
        if (!validSpec.includes(sInput.toLowerCase())) {
          aReturn.push(`Please select one of the valid type.\n (${validSpec.toString()}) `);
          break;
        }
        this.stateCur = OrderState.DRINKS;
        aReturn.push(`What drink would you like with that ?`);
        this.sThirdItemSpec = sInput;
        this.sTotal += 10;
        break;
      case OrderState.DRINKS:
        aReturn.push(`Would you like fries with that ?`);
        if (validDrinks.includes(sInput.toLowerCase())) {
          this.sDrinks = sInput;
          this.sTotal += 3;
          this.stateCur = OrderState.FRIES;
        } else if (sInput.toLowerCase() == 'no') {
          this.stateCur = OrderState.FRIES;
        } else {
          aReturn.push('Please enter one of the available drinks below or enter no');
          aReturn.push(validDrinks.toString());
        }
        break;
      case OrderState.FRIES:
        this.isDone(true);
        if (sInput.toLowerCase() == "yes") {
          this.sFries = sInput;
          this.sTotal += 5;
          this.stateCur = OrderState.PAYMENT;
        } else if(sInput.toLowerCase() == "no") {
          this.stateCur = OrderState.PAYMENT;
        } else {
          aReturn.push('Please enter yes/no');
          break;
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
        this.sTotal = this.sTotal.toFixed(2);
        aReturn.push(`Your total is $${this.sTotal}`);
        aReturn.push(`Please pay for your order here`);
        aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
        break;
      case OrderState.PAYMENT:
        let address = sInput.purchase_units[0].shipping.address;
        let deliveryaddress = `${address.address_line_1}, ${address.address_line_2}, ${address.admin_area_2}, ${address.admin_area_1} ${address.postal_code}`;
        this.isDone(true);
        let d = new Date();
        d.setMinutes(d.getMinutes() + 20);
        aReturn.push(`Your order will be delivered at ${d.toTimeString()} to the below address`);
        aReturn.push(deliveryaddress);
        break;
    }
    return aReturn;
  }
  renderForm(sTitle = "-1", sAmount = "-1") {
    // your client id should be kept private
    if (sTitle != "-1") {
      this.sItem = sTitle;
    }
    if (sAmount != "-1") {
      this.sTotal = sAmount;
    }
    const sClientID = process.env.SB_CLIENT_ID || 'put your client id here for testing ... Make sure that you delete it before committing'
    return (`
      <!DOCTYPE html>
  
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1"> <!-- Ensures optimal rendering on mobile devices. -->
        <meta http-equiv="X-UA-Compatible" content="IE=edge" /> <!-- Optimal Internet Explorer compatibility -->
      </head>
      
      <body>
        <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
        <script
          src="https://www.paypal.com/sdk/js?client-id=${sClientID}"> // Required. Replace SB_CLIENT_ID with your sandbox client ID.
        </script>
        Thank you ${this.sNumber} for your ${this.sItem} order of $${this.sTotal}.
        <div id="paypal-button-container"></div>
  
        <script>
          paypal.Buttons({
              createOrder: function(data, actions) {
                // This function sets up the details of the transaction, including the amount and line item details.
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: '${this.sTotal}'
                    }
                  }]
                });
              },
              onApprove: function(data, actions) {
                // This function captures the funds from the transaction.
                return actions.order.capture().then(function(details) {
                  // This function shows a transaction success message to your buyer.
                  $.post(".", details, ()=>{
                    window.open("", "_self");
                    window.close(); 
                  });
                });
              }
          
            }).render('#paypal-button-container');
          // This function displays Smart Payment Buttons on your web page.
        </script>
      
      </body>
          
      `);

  }
}