const { AlchemySigner } = require("@alchemy/aa-alchemy");
const ck = require("ckey");
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

// ... within your getAlchemySigner function
const dom = new JSDOM(); 
global.document = dom.window.document;
global.document.createElement = function(tagName) {
    if (tagName === 'iframe') {
        return { 
            contentDocument: document, // Basic document
            contentWindow: {  // Simulate a basic window object
               postMessage: () => {}  // Placeholder function
            }
            // You may need more properties/functions here 
        }; 
    }
    // ... other element mocking if needed
};

exports.getAlchemySigner = async (req, res) => {
  try {
    console.log("\n\n\nInitializing signer in the server\n\n\n",ck.ALCHEMY_API_KEY);
    const signer = new AlchemySigner({
      client: {
        connection: { apiKey: ck.ALCHEMY_API_KEY },
        iframeConfig: { iframeContainerId: "turnkey-iframe-container" },
      },
    });

    console.log("signer", signer);

    res.status(200).json({ // Use appropriate status code
      status: "success getAllPlayerStakes",
      data: earningsList, // Assuming you have 'earningsList' defined 
    });

  } catch (error) {
    console.error("Error initializing signer:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error" // Provide a generic error message
    });
  }
}


