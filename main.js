/** Connect to Moralis server */
const serverUrl = "https://pu3i7qbbkrtq.usemoralis.com:2053/server";
const appId = "5YTGCpBDEdYadzLCtMnmgJvedpSREVzONkYCTX4Z";
Moralis.start({ serverUrl, appId });



/** Add from here down */
let currentTrade = {};
let currentSelectSide
let tokens;

async function init(){
    await Moralis.initPlugins(); 
    await Moralis.enable; 
    await listAvailableTokens();
    let user = Moralis.User.current();
    if (user) {
      document.getElementById("swap_button").disabled = false;
    }
    
}


async function listAvailableTokens(){
    const result = await Moralis.Plugins.oneInch.getSupportedTokens({
        // The blockchain you want to use (eth/bsc/polygon)
      chain: "eth",
    });

    tokens = result.tokens;
    let parent = document.getElementById("token_list");
    console.log(tokens);
    for(const address in tokens ){
        let token = tokens[address];
        let div = document.createElement("div");
        div.setAttribute('data-address', address);
        div.className = "token_row";
        let html = `
            <img class="token_list_img" src=${token.logoURI} alt="">
            <span class="token_list_text">${token.symbol}</span>
        `;
        div.innerHTML = html;
        div.onclick = (() => {selectToken(address)});
        parent.appendChild(div);
    }
}

async function selectToken(address){
    closeModal(); 
    // let address = event.target.getAttribute("data-address");
    // console.log(address);
    currentTrade[currentSelectSide] = tokens[address];
    console.log(currentTrade);
    renderInterface()
    getQoute();
}

function renderInterface(){
    if(currentTrade.from){
        document.getElementById("from_token_img").src = currentTrade.from.logoURI;
        document.getElementById("from_token_text").textContent = currentTrade.from.symbol;
    }

    if(currentTrade.to){
        document.getElementById("to_token_img").src = currentTrade.to.logoURI;
        document.getElementById("to_token_text").textContent = currentTrade.to.symbol;
    }
    
    
}

async function login() {
  let user = Moralis.User.current();
  if (!user) {
    try {
        user = await Moralis.authenticate({ signingMessage: "Hello World!" });
        console.log(user);
        document.getElementById("swap_button").disabled = false;
        console.log(user.get("ethAddress"));
    } catch (error) {
      console.log(error);
    }
  }
}

async function logOut() {
  await Moralis.User.logOut();
  console.log("logged out");
  
}

function openModal(side){
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}

function closeModal(){
    document.getElementById("token_modal").style.display = "none";
}

async function getQoute(){

    if(!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;
    let amount = Number( 
        document.getElementById("from_amount").value * 10**currentTrade.from.decimals 
        );
    
    const quote = await Moralis.Plugins.oneInch.quote({
        chain: "eth", // The blockchain you want to use (eth/bsc/polygon)
        fromTokenAddress: currentTrade.from.address, // The token you want to swap
        toTokenAddress: currentTrade.to.address, // The token you want to receive
        amount: amount, 
    });
    console.log(quote); 
    document.getElementById("gas_estimate").textContent = quote.estimatedGas;
    document.getElementById("to_amount").value = quote.toTokenAmount / (10**quote.toToken.decimals)
} 

async function trySwap(){
    let address = Moralis.User.current().get("ethAddress");
    let amount = Number(
      document.getElementById("from_amount").value *
        10 ** currentTrade.from.decimals
    );

    if(currentTrade.from.symbol !== 'ETH'){
      
      const allowance = await Moralis.Plugins.oneInch.hasAllowance({
        chain: "eth",
        // The blockchain you want to use (eth/bsc/polygon)
        fromTokenAddress: currentTrade.from.address,
        // The token you want to swap
        fromAddress: address,
        // Your wallet address
        amount: amount,
      });
      
      console.log(allowance)
      if(!allowance){
        await Moralis.Plugins.oneInch.approve({
          chain: "eth",
          // The blockchain you want to use (eth/bsc/polygon)
          tokenAddress: currentTrade.from.address,
          // The token you want to swap
          fromAddress: address,
          // Your wallet address
        });
      }
    }
   let receipt = await doSwap(address, amount);
   alert("Payment done")
}

function doSwap(userAddress, amount){

    return Moralis.Plugins.oneInch.swap({
      chain: "bsc",
      // The blockchain you want to use (eth/bsc/polygon)
      fromTokenAddress: currentTrade.from.address,
      // The token you want to swap
      toTokenAddress: currentTrade.to.address,
      // The token you want to receive
      amount: amount,
      fromAddress: userAddress,
      // Your wallet address
      slippage: 1,
    });
}


init();
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_token_select").onclick = (() => {openModal("from")});
document.getElementById("to_token_select").onclick = (() => {openModal("to")});
document.getElementById("from_amount").onblur = getQoute;
document.getElementById("swap_button").onclick = trySwap;
document.getElementById("btn-login").onclick = login;
document.getElementById("btn-logout").onclick = logOut;



/** Useful Resources  */

// https://docs.moralis.io/moralis-server/users/crypto-login
// https://docs.moralis.io/moralis-server/getting-started/quick-start#user
// https://docs.moralis.io/moralis-server/users/crypto-login#metamask

/** Moralis Forum */

// https://forum.moralis.io/
