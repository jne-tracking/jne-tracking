
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response(`
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>JNE Tracking</title>
<style>
body {
  font-family: Arial;
  background: #f1f4f9;
  padding: 20px;
}
.card {
  max-width: 450px;
  margin: 50px auto;
  background: white;
  padding: 25px;
  border-radius: 12px;
}
h1 {color:#173b83;text-align:center}
input,button {
  width:100%;
  padding:14px;
  margin-top:12px;
  box-sizing:border-box;
  border-radius:7px;
}
input {border:1px solid #ccc}
button {
  background:#173b83;
  color:white;
  border:0;
  font-weight:bold;
}
pre {
  white-space:pre-wrap;
  overflow-wrap:anywhere;
}
</style>
</head>
<body>
<div class="card">
<h1>JNE TRACKING</h1>
<p>Masukkan nomor resi JNE</p>
<input id="awb" placeholder="Nomor resi">
<button onclick="cek()">CEK RESI</button>
<p id="status"></p>
<pre id="hasil"></pre>
</div>
<script>
async function cek() {
  const awb = document.getElementById("awb").value.trim();
  const status = document.getElementById("status");
  const hasil = document.getElementById("hasil");

  if (!awb) {
    alert("Masukkan nomor resi");
    return;
  }

  status.textContent = "Menghubungi JNE...";
  hasil.textContent = "";

  try {
    const r = await fetch("/api/track", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({awb})
    });

    const data = await r.json();
    status.textContent = "HTTP " + r.status;
    hasil.textContent = JSON.stringify(data,null,2);
  } catch(e) {
    status.textContent = "Gagal menghubungi server";
    hasil.textContent = e.message;
  }
}
</script>
</body>
</html>`, {
        headers: {"Content-Type":"text/html;charset=UTF-8"}
      });
    }

    if (url.pathname === "/api/track" && request.method === "POST") {
      try {
        const {awb} = await request.json();

        if (!awb) {
          return Response.json({error:"Nomor resi wajib diisi"}, {status:400});
        }

        if (!env.JNE_USERNAME || !env.JNE_API_KEY) {
          return Response.json({error:"Kredensial Sandbox belum diatur"}, {status:500});
        }

        const body = new URLSearchParams();
        body.set("username", env.JNE_USERNAME);
        body.set("api_key", env.JNE_API_KEY);

        const response = await fetch(
          "https://apiv2.jne.co.id:10202/tracing/api/list/v1/cnote/" +
          encodeURIComponent(awb),
          {
            method:"POST",
            headers:{
              "Content-Type":"application/x-www-form-urlencoded",
              "Accept":"application/json"
            },
            body:body.toString()
          }
        );

        const result = await response.text();

        return new Response(JSON.stringify({
          jne_status:response.status,
          result:result
        }), {
          status:200,
          headers:{"Content-Type":"application/json"}
        });

      } catch(error) {
        return Response.json({
          error:error.message
        }, {status:502});
      }
    }

    return new Response("Not Found",{status:404});
  }
};
