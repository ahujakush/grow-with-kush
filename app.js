const supabase = window.supabase.createClient(
  window.KUSH_SUPABASE_URL,
  window.KUSH_SUPABASE_PUBLISHABLE_KEY
);

let currentUser = null;
let dailyLogs = [];
let topics = [];
let bycTasks = [];
let authMode = "login";
let currentTopicFilter = "All";
let currentLogFilter = "All";

const defaultTopics = [
  ["DSA","Arrays","June 2026","Roadmap","", "Not Started","Not Started",25,0,"Basics, max/min, reverse, prefix sum, kadane intro."],
  ["DSA","Strings","June 2026","Roadmap","", "Not Started","Not Started",15,0,"Palindrome, anagram, frequency, substring basics."],
  ["DSA","HashMap","July 2026","Roadmap","", "Not Started","Not Started",20,0,"Frequency count, two sum, duplicates, grouping."],
  ["DSA","Two Pointers","July 2026","Roadmap","", "Not Started","Not Started",20,0,"Pair sum, sorted arrays, palindrome variations."],
  ["DSA","Sliding Window","August 2026","Roadmap","", "Not Started","Not Started",20,0,"Fixed and variable window."],
  ["DSA","Binary Search","August 2026","Roadmap","", "Not Started","Not Started",20,0,"First/last occurrence, answer search."],
  ["DSA","Recursion","Flexible / Later","Roadmap","", "Not Started","Not Started",15,0,"Base case, call stack, recursion tree."],
  ["OOP","Python OOP","June-Aug 2026","Roadmap","", "Not Started","Not Started",8,0,"Class, object, constructor, inheritance, encapsulation."],
  ["SQL/DBMS","SQL Basics","July-Aug 2026","Roadmap","", "Not Started","Not Started",20,0,"SELECT, WHERE, GROUP BY, JOINS."],
  ["Backend/API","FastAPI Routes","Sep-Dec 2026","Roadmap","", "Not Started","Not Started",8,0,"GET, POST, validation, error handling."],
  ["BYC","BYC Technical Map","June 2026","BYC Need","", "Not Started","Not Started",1,0,"Pages, API routes, Supabase tables, ElevenLabs flow, Groq flow."]
];

const defaultBycTasks = [
  "Map BYC pages and components",
  "Map BYC API routes: input → output → DB table",
  "Understand Supabase tables and user_id relationships",
  "Explain ElevenLabs call → webhook → transcript flow",
  "Build Mini BYC Backend in FastAPI",
  "Prepare BYC technical case study for resume"
];

const weeklyPlanData = [
  ["Monday", "DSA", "BYC daily"],
  ["Tuesday", "Backend / API / SQL", "BYC daily"],
  ["Wednesday", "DSA", "BYC daily"],
  ["Thursday", "CS Fundamentals / OOP / DBMS", "BYC daily"],
  ["Friday", "DSA", "BYC daily"],
  ["Saturday", "Backend + BYC deep work", "BYC deep"],
  ["Sunday", "Review / light DSA / rest", "Light BYC"],
];

function $(id){ return document.getElementById(id); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function escapeHtml(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }

document.addEventListener("DOMContentLoaded", init);

async function init(){
  $("todayDate").textContent = new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  $("logDate").value = todayISO();

  document.querySelectorAll(".nav-link").forEach(btn => btn.addEventListener("click", () => setPage(btn.dataset.page)));
  document.querySelectorAll("[data-page-jump]").forEach(btn => btn.addEventListener("click", () => setPage(btn.dataset.pageJump)));

  document.querySelectorAll(".auth-tab").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    authMode = btn.dataset.authMode;
    $("authSubmit").textContent = authMode === "login" ? "Login" : "Create Account";
  }));

  $("authForm").addEventListener("submit", handleAuth);
  $("logoutBtn").addEventListener("click", logout);
  $("refreshBtn").addEventListener("click", loadAll);
  $("dailyForm").addEventListener("submit", saveDailyLog);
  $("cancelEditBtn").addEventListener("click", resetDailyForm);
  $("addTopicBtn").addEventListener("click", () => $("topicFormWrap").classList.toggle("hidden"));
  $("topicForm").addEventListener("submit", saveTopic);
  $("exportJson").addEventListener("click", exportJson);
  $("exportCsv").addEventListener("click", exportCsv);

  document.querySelectorAll(".topic-filter").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll(".topic-filter").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    currentTopicFilter = btn.dataset.filter;
    renderTopics();
  }));

  document.querySelectorAll(".log-filter").forEach(btn => btn.addEventListener("click", () => {
    document.querySelectorAll(".log-filter").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    currentLogFilter = btn.dataset.logFilter;
    renderAllLogs();
  }));

  const { data: { session } } = await supabase.auth.getSession();
  if(session?.user){
    await enterApp(session.user);
  }

  supabase.auth.onAuthStateChange(async (_event, session) => {
    if(session?.user) await enterApp(session.user);
    else showAuth();
  });
}

async function handleAuth(e){
  e.preventDefault();
  showAuthMessage("Please wait...");
  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;

  let result;
  if(authMode === "signup"){
    result = await supabase.auth.signUp({ email, password });
    if(result.error) return showAuthMessage(result.error.message);
    showAuthMessage("Account created. If email confirmation is enabled, confirm email first. Otherwise you can login now.");
  } else {
    result = await supabase.auth.signInWithPassword({ email, password });
    if(result.error) return showAuthMessage(result.error.message);
    await enterApp(result.data.user);
  }
}

function showAuthMessage(message){
  $("authMessage").textContent = message;
  $("authMessage").classList.remove("hidden");
}

async function enterApp(user){
  currentUser = user;
  $("authScreen").classList.add("hidden");
  $("appShell").classList.remove("hidden");
  $("userEmail").textContent = user.email || "Logged in";
  await loadAll();
}

function showAuth(){
  currentUser = null;
  $("authScreen").classList.remove("hidden");
  $("appShell").classList.add("hidden");
}

async function logout(){
  await supabase.auth.signOut();
  showAuth();
}

async function loadAll(){
  if(!currentUser) return;
  await Promise.all([loadDailyLogs(), loadTopics(), loadBycTasks()]);
  await seedDefaultsIfEmpty();
  await Promise.all([loadDailyLogs(), loadTopics(), loadBycTasks()]);
  renderAll();
}

async function loadDailyLogs(){
  const { data, error } = await supabase.from("daily_logs").select("*").order("log_date",{ascending:false}).order("created_at",{ascending:false});
  if(error) return alert(error.message);
  dailyLogs = data || [];
}

async function loadTopics(){
  const { data, error } = await supabase.from("flexible_topics").select("*").order("created_at",{ascending:true});
  if(error) return alert(error.message);
  topics = data || [];
}

async function loadBycTasks(){
  const { data, error } = await supabase.from("byc_lab_tasks").select("*").order("created_at",{ascending:true});
  if(error) return alert(error.message);
  bycTasks = data || [];
}

async function seedDefaultsIfEmpty(){
  if(topics.length === 0){
    const rows = defaultTopics.map(t => ({
      user_id: currentUser.id,
      area: t[0],
      topic: t[1],
      planned_phase: t[2],
      source: t[3],
      source_name: t[4],
      class_status: t[5],
      mastery_status: t[6],
      target_problems: t[7],
      problems_done: t[8],
      notes: t[9]
    }));
    await supabase.from("flexible_topics").insert(rows);
  }
  if(bycTasks.length === 0){
    const rows = defaultBycTasks.map(task => ({ user_id: currentUser.id, task, is_done:false }));
    await supabase.from("byc_lab_tasks").insert(rows);
  }
}

function setPage(page){
  document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
  $(page).classList.add("active");
  document.querySelector(`.nav-link[data-page="${page}"]`)?.classList.add("active");
  const titles = {dashboard:"Dashboard",today:"Add / Edit Log",logs:"All Logs",topics:"Flexible Topic Tracker",roadmap:"Roadmap",byc:"BYC Lab",resources:"Resources",data:"Backup"};
  $("pageTitle").textContent = titles[page] || "Dashboard";
  renderAll();
}

async function saveDailyLog(e){
  e.preventDefault();
  const id = $("editLogId").value;
  const row = {
    user_id: currentUser.id,
    log_date: $("logDate").value,
    energy: $("energy").value,
    study_area: $("area").value,
    learning_type: $("source").value,
    source_name: $("sourceName").value.trim(),
    source_link: $("sourceLink").value.trim(),
    topic: $("topic").value.trim(),
    subtopic: $("subtopic").value.trim(),
    status: $("status").value,
    problems_done: Number($("problems").value || 0),
    study_hours: Number($("hours").value || 0),
    byc_minutes: Number($("bycMinutes").value || 0),
    confidence: $("confidence").value,
    notes: $("notes").value.trim()
  };

  let result;
  if(id){
    result = await supabase.from("daily_logs").update(row).eq("id", id);
  } else {
    result = await supabase.from("daily_logs").insert(row);
  }
  if(result.error) return alert(result.error.message);

  await updateTopicFromLog(row);
  resetDailyForm();
  await loadAll();
  setPage("dashboard");
}

async function updateTopicFromLog(log){
  const matching = topics.find(t => (t.topic || "").toLowerCase() === log.topic.toLowerCase() && (t.area || "").toLowerCase() === log.study_area.toLowerCase());
  if(!matching) return;
  const patch = {};
  if(log.status === "Done ✅" || log.status === "Class Done") patch.class_status = "Class Done";
  if(log.status === "In Progress") patch.class_status = "Class Started";
  if(log.study_area === "DSA" && log.problems_done > 0) patch.problems_done = Number(matching.problems_done || 0) + Number(log.problems_done || 0);
  if(Object.keys(patch).length){
    await supabase.from("flexible_topics").update(patch).eq("id", matching.id);
  }
}

function resetDailyForm(){
  $("dailyForm").reset();
  $("editLogId").value = "";
  $("logDate").value = todayISO();
  $("hours").value = 1;
  $("bycMinutes").value = 60;
  $("problems").value = 0;
  $("dailyFormTitle").textContent = "Add today’s real learning";
  $("formModeLabel").textContent = "Daily Tracker";
  $("saveLogBtn").textContent = "Save Daily Log";
  $("cancelEditBtn").classList.add("hidden");
}

function editLog(id){
  const l = dailyLogs.find(x => x.id === id);
  if(!l) return;
  $("editLogId").value = l.id;
  $("logDate").value = l.log_date;
  $("energy").value = l.energy;
  $("area").value = l.study_area;
  $("source").value = l.learning_type;
  $("sourceName").value = l.source_name || "";
  $("sourceLink").value = l.source_link || "";
  $("topic").value = l.topic;
  $("subtopic").value = l.subtopic || "";
  $("status").value = l.status;
  $("problems").value = l.problems_done || 0;
  $("hours").value = l.study_hours || 0;
  $("bycMinutes").value = l.byc_minutes || 0;
  $("confidence").value = l.confidence || "Medium";
  $("notes").value = l.notes || "";
  $("dailyFormTitle").textContent = "Edit daily log";
  $("formModeLabel").textContent = "Edit Mode";
  $("saveLogBtn").textContent = "Update Log";
  $("cancelEditBtn").classList.remove("hidden");
  setPage("today");
}

async function deleteLog(id){
  if(!confirm("Delete this log?")) return;
  const { error } = await supabase.from("daily_logs").delete().eq("id", id);
  if(error) return alert(error.message);
  await loadAll();
}

async function saveTopic(e){
  e.preventDefault();
  const row = {
    user_id: currentUser.id,
    area: $("topicArea").value,
    topic: $("topicName").value.trim(),
    planned_phase: $("plannedPhase").value.trim() || "Flexible",
    source: $("topicSource").value,
    source_name: $("topicSourceName").value.trim(),
    class_status: $("classStatus").value,
    mastery_status: $("masteryStatus").value,
    target_problems: Number($("targetProblems").value || 0),
    problems_done: Number($("topicProblemsDone").value || 0),
    notes: $("topicNotes").value.trim()
  };
  const { error } = await supabase.from("flexible_topics").insert(row);
  if(error) return alert(error.message);
  $("topicForm").reset();
  $("topicFormWrap").classList.add("hidden");
  await loadAll();
}

async function updateTopic(id, field, value){
  const { error } = await supabase.from("flexible_topics").update({[field]: value}).eq("id", id);
  if(error) return alert(error.message);
  await loadAll();
}

async function deleteTopic(id){
  if(!confirm("Delete this topic?")) return;
  const { error } = await supabase.from("flexible_topics").delete().eq("id", id);
  if(error) return alert(error.message);
  await loadAll();
}

async function toggleByc(id, checked){
  const { error } = await supabase.from("byc_lab_tasks").update({is_done: checked}).eq("id", id);
  if(error) return alert(error.message);
  await loadAll();
}

function renderAll(){
  renderDashboard();
  renderWeeklyPlan();
  renderRecentLogs();
  renderAllLogs();
  renderTopics();
  renderByc();
}

function renderDashboard(){
  const totalHours = dailyLogs.reduce((sum,l)=>sum+Number(l.study_hours||0)+Number(l.byc_minutes||0)/60,0);
  const dsaProblems = dailyLogs.filter(l=>l.study_area==="DSA").reduce((sum,l)=>sum+Number(l.problems_done||0),0);
  const bycDays = new Set(dailyLogs.filter(l=>Number(l.byc_minutes||0)>0 || l.study_area==="BYC").map(l=>l.log_date)).size;
  const mastered = topics.filter(t=>t.mastery_status==="Mastered ✅").length;
  const masteryPercent = topics.length ? Math.round(mastered/topics.length*100) : 0;
  $("totalHours").textContent = totalHours.toFixed(1);
  $("dsaProblems").textContent = dsaProblems;
  $("bycDays").textContent = bycDays;
  $("masteryPercent").textContent = `${masteryPercent}%`;

  const day = new Date().getDay();
  const plan = {
    1:["BYC + DSA","One quality DSA problem plus BYC progress."],
    2:["BYC + Backend/API/SQL","Understand one engineering concept and apply it to BYC."],
    3:["BYC + DSA","Pattern practice, not random grinding."],
    4:["BYC + CS/OOP/DBMS","Build real fundamentals."],
    5:["BYC + DSA","End week with DSA consistency."],
    6:["BYC Deep Work + Backend","Build or debug one real feature."],
    0:["Light BYC + Review","Review, plan, and rest without guilt."]
  };
  $("todayFocus").textContent = plan[day][0];
  $("todayFocusHint").textContent = plan[day][1];

  renderAreaBars();
  renderHoursChart();
  renderDsaTopicChart();
}

function renderWeeklyPlan(){
  $("weeklyPlan").innerHTML = weeklyPlanData.map(([day,study,byc]) => `<div class="day-row"><strong>${day}</strong><span>${study}</span><span class="badge">${byc}</span></div>`).join("");
}

function renderAreaBars(){
  const totals = {};
  dailyLogs.forEach(l => {
    totals[l.study_area] = (totals[l.study_area] || 0) + Number(l.study_hours || 0);
    if(Number(l.byc_minutes || 0) > 0) totals["BYC"] = (totals["BYC"] || 0) + Number(l.byc_minutes || 0)/60;
  });
  const entries = Object.entries(totals).sort((a,b)=>b[1]-a[1]);
  const max = Math.max(...entries.map(e=>e[1]),1);
  $("areaBars").innerHTML = entries.length ? entries.map(([area,hours]) => `<div><div class="bar-label"><span>${escapeHtml(area)}</span><strong>${hours.toFixed(1)}h</strong></div><div class="bar-track"><div class="bar-fill" style="width:${Math.round(hours/max*100)}%"></div></div></div>`).join("") : `<div class="empty-state">No area data yet.</div>`;
}

function renderHoursChart(){
  const days = [];
  for(let i=13;i>=0;i--){
    const d = new Date();
    d.setDate(d.getDate()-i);
    days.push(d.toISOString().slice(0,10));
  }
  const values = days.map(date => dailyLogs.filter(l=>l.log_date===date).reduce((s,l)=>s+Number(l.study_hours||0)+Number(l.byc_minutes||0)/60,0));
  const max = Math.max(...values,1);
  $("hoursChart").innerHTML = days.map((date,i)=>{
    const h = values[i];
    return `<div class="chart-col"><span class="chart-value">${h.toFixed(1)}</span><div class="chart-bar" style="height:${Math.max(3, Math.round(h/max*150))}px"></div><span class="chart-label">${date.slice(5)}</span></div>`;
  }).join("");
}

function renderDsaTopicChart(){
  const totals = {};
  dailyLogs.filter(l=>l.study_area==="DSA").forEach(l => totals[l.topic] = (totals[l.topic]||0)+Number(l.problems_done||0));
  const entries = Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const max = Math.max(...entries.map(e=>e[1]),1);
  $("dsaTopicChart").innerHTML = entries.length ? entries.map(([topic,count]) => `<div class="chart-col"><span class="chart-value">${count}</span><div class="chart-bar" style="height:${Math.max(3, Math.round(count/max*150))}px"></div><span class="chart-label">${escapeHtml(topic)}</span></div>`).join("") : `<div class="empty-state">No DSA problem data yet.</div>`;
}

function renderRecentLogs(){
  const logs = dailyLogs.slice(0,7);
  $("recentLogs").className = logs.length ? "log-list" : "log-list empty-state";
  $("recentLogs").innerHTML = logs.length ? logs.map(l => logCard(l)).join("") : "No logs yet. Add your first daily entry.";
}

function logCard(l){
  return `<div class="log-item"><div><span class="badge">${l.log_date}</span></div><div><strong>${escapeHtml(l.study_area)} — ${escapeHtml(l.topic)}</strong><p>${escapeHtml(l.subtopic || "No subtopic")} · ${escapeHtml(l.status)} · ${Number(l.study_hours||0)}h study · ${Number(l.byc_minutes||0)}m BYC</p><p>${escapeHtml(l.learning_type)}${l.source_name ? " · " + escapeHtml(l.source_name) : ""}</p>${l.notes ? `<p>${escapeHtml(l.notes)}</p>` : ""}</div><div class="button-row"><button class="small-btn edit-btn" onclick="editLog('${l.id}')">Edit</button><button class="small-btn" onclick="deleteLog('${l.id}')">Delete</button></div></div>`;
}

function renderAllLogs(){
  let logs = currentLogFilter === "All" ? dailyLogs : dailyLogs.filter(l=>l.study_area===currentLogFilter);
  $("allLogsTable").innerHTML = logs.length ? `<table><thead><tr><th>Date</th><th>Area</th><th>Topic</th><th>Source</th><th>Progress</th><th>Notes</th><th></th></tr></thead><tbody>${logs.map(l=>`<tr><td>${l.log_date}</td><td><span class="badge">${escapeHtml(l.study_area)}</span></td><td><strong>${escapeHtml(l.topic)}</strong><br><small>${escapeHtml(l.subtopic||"")}</small></td><td>${escapeHtml(l.learning_type)}<br><small>${escapeHtml(l.source_name||"")}</small></td><td>${escapeHtml(l.status)}<br><small>${Number(l.study_hours||0)}h · ${Number(l.problems_done||0)} problems</small></td><td>${escapeHtml(l.notes||"")}</td><td><button class="small-btn edit-btn" onclick="editLog('${l.id}')">Edit</button> <button class="small-btn" onclick="deleteLog('${l.id}')">Delete</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty-state">No logs found.</div>`;
}

function renderTopics(){
  let list = currentTopicFilter === "All" ? topics : topics.filter(t=>t.area===currentTopicFilter);
  $("topicsTable").innerHTML = list.length ? `<table><thead><tr><th>Area</th><th>Topic</th><th>Planned</th><th>Class</th><th>Mastery</th><th>Problems</th><th>Source</th><th>Notes</th><th></th></tr></thead><tbody>${list.map(t=>`<tr><td><span class="badge">${escapeHtml(t.area)}</span></td><td><strong>${escapeHtml(t.topic)}</strong></td><td>${escapeHtml(t.planned_phase||"Flexible")}</td><td><select class="inline-select" onchange="updateTopic('${t.id}','class_status',this.value)">${["Not Started","Class Started","Class Done"].map(v=>`<option ${t.class_status===v?"selected":""}>${v}</option>`).join("")}</select></td><td><select class="inline-select" onchange="updateTopic('${t.id}','mastery_status',this.value)">${["Not Started","In Progress","Mastered ✅"].map(v=>`<option ${t.mastery_status===v?"selected":""}>${v}</option>`).join("")}</select></td><td><input class="inline-input" type="number" min="0" value="${Number(t.problems_done||0)}" onchange="updateTopic('${t.id}','problems_done',Number(this.value))" /><small>/ ${Number(t.target_problems||0)} target</small></td><td>${escapeHtml(t.source||"")}<br><small>${escapeHtml(t.source_name||"")}</small></td><td><textarea class="inline-input" rows="2" onchange="updateTopic('${t.id}','notes',this.value)">${escapeHtml(t.notes||"")}</textarea></td><td><button class="small-btn" onclick="deleteTopic('${t.id}')">Delete</button></td></tr>`).join("")}</tbody></table>` : `<div class="empty-state">No topics found.</div>`;
}

function renderByc(){
  $("bycChecklist").innerHTML = bycTasks.map(task => `<label class="check-item"><input type="checkbox" ${task.is_done ? "checked" : ""} onchange="toggleByc('${task.id}', this.checked)" /><span>${escapeHtml(task.task)}</span></label>`).join("");
}

function exportJson(){
  const data = { dailyLogs, topics, bycTasks, exportedAt: new Date().toISOString() };
  downloadBlob(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),`kush-growth-os-${todayISO()}.json`);
}

function exportCsv(){
  const headers = ["log_date","energy","study_area","learning_type","source_name","source_link","topic","subtopic","status","problems_done","study_hours","byc_minutes","confidence","notes"];
  const rows = dailyLogs.map(l => headers.map(h => `"${String(l[h] ?? "").replaceAll('"','""')}"`).join(","));
  downloadBlob(new Blob([[headers.join(","), ...rows].join("\n")],{type:"text/csv"}),`kush-daily-logs-${todayISO()}.csv`);
}

function downloadBlob(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

window.editLog = editLog;
window.deleteLog = deleteLog;
window.updateTopic = updateTopic;
window.deleteTopic = deleteTopic;
window.toggleByc = toggleByc;
