const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhyc3VqYWx6YnZ2bHlwbGVoZHJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTAzNDMsImV4cCI6MjA5ODU2NjM0M30.xewCP7FmemrZ1D7_wtlsPjT1tQlTUBcLa52hi6_R1sE";
const url = "https://xrsujalzbvvlyplehdrm.supabase.co/rest/v1/profiles?select=id,full_name,role&limit=1";

fetch(url, {
  headers: {
    "apikey": anonKey,
    "Authorization": `Bearer ${anonKey}`
  }
})
.then(async res => {
  console.log("Status Code:", res.status);
  const text = await res.text();
  console.log("Profiles list:", text);
})
.catch(err => {
  console.error("Fetch failed", err);
});
