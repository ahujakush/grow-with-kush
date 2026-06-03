const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = fs.readFileSync('index.html', 'utf8');
const configJs = fs.readFileSync('config.js', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');

const dom = new JSDOM(html, { runScripts: "dangerously" });
const window = dom.window;

// Mock Supabase
window.supabase = {
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => {},
      signInWithOAuth: async () => { console.log("MOCK: signInWithOAuth called"); return { error: null }; },
      signInWithPassword: async () => { console.log("MOCK: signInWithPassword called"); return { error: null }; },
      signUp: async () => { console.log("MOCK: signUp called"); return { error: null }; }
    }
  })
};

const script1 = window.document.createElement("script");
script1.textContent = configJs;
window.document.body.appendChild(script1);

const script2 = window.document.createElement("script");
script2.textContent = appJs;
window.document.body.appendChild(script2);

setTimeout(() => {
  console.log("Testing clicks...");
  
  const googleBtn = window.document.getElementById("googleLoginBtn");
  if (googleBtn) {
    console.log("Clicking Google btn...");
    googleBtn.click();
  } else {
    console.log("googleBtn not found");
  }

  const authSubmit = window.document.getElementById("authSubmit");
  if (authSubmit) {
    console.log("Clicking Auth Submit...");
    authSubmit.click(); // NOTE: JSDOM might not fire form submit on button click easily without properly handling forms.
  }

}, 1000);
