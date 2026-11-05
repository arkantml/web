const DATA = /*D*/ {
  judul: "Repositori Dokumentasi",
  deskripsi:
    "Kumpulan album foto dan video kegiatan. Pilih album untuk membukanya di Google Drive.",
  items: [
    {
      id: "c1",
      judul: "Dokumentasi Kegiatan A",
      link: "https://drive.google.com/",
      kategori: "Kegiatan",
      tanggal: "2026-10-12",
      tipe: "foto",
      jumlah: "±250 foto",
      deskripsi: "Contoh data. Ganti lewat mode Kelola.",
      contoh: true,
    },
    {
      id: "c2",
      judul: "Rekaman Acara B",
      link: "https://drive.google.com/",
      kategori: "Acara",
      tanggal: "2026-09-03",
      tipe: "video",
      jumlah: "12 video",
      deskripsi: "Contoh data. Ganti lewat mode Kelola.",
      contoh: true,
    },
    {
      id: "c3",
      judul: "Arsip Lomba C",
      link: "https://drive.google.com/",
      kategori: "Lomba",
      tanggal: "2026-08-17",
      tipe: "campuran",
      jumlah: "±400 berkas",
      deskripsi: "Contoh data. Ganti lewat mode Kelola.",
      contoh: true,
    },
  ],
}; /*E*/
const SRC = document.currentScript.textContent;
(() => {
  const $ = (s) => document.querySelector(s);
  const TIPE = {
    foto: { e: "📷", l: "Foto" },
    video: { e: "🎬", l: "Video" },
    campuran: { e: "🗂️", l: "Foto & video" },
  };
  const SORT = {
    baru: (a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""),
    lama: (a, b) => (a.tanggal || "9").localeCompare(b.tanggal || "9"),
    nama: (a, b) => a.judul.localeCompare(b.judul, "id"),
  };
  const FONT =
    "https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=Public+Sans:wght@400;600&display=swap";
  const data = JSON.parse(JSON.stringify(DATA));
  let q = "",
    kat = "",
    tip = "",
    so = "baru",
    manage = false,
    canEdit = false,
    dirty = false,
    editId = null,
    art = null,
    tt;
  const txt = (v, n) =>
    String(v == null ? "" : v)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, n);
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const uid = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const okLink = (s) => {
    try {
      const u = new URL(String(s).trim());
      return u.protocol === "https:" ? u.href : null;
    } catch (e) {
      return null;
    }
  };
  const okDate = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || "") ? s : "");
  const fdate = (s) =>
    s
      ? new Date(s + "T00:00:00").toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "";
  function h(t, a, ...k) {
    const e = document.createElement(t);
    for (const x in a || {}) {
      const v = a[x];
      if (x === "on") for (const ev in v) e.addEventListener(ev, v[ev]);
      else if (x === "text") e.textContent = v;
      else if (v !== false && v != null) e.setAttribute(x, v);
    }
    for (const c of k.flat()) if (c != null && c !== false) e.append(c);
    return e;
  }
  function toast(m, err) {
    const t = $("#toast");
    t.textContent = m;
    t.className = "show" + (err ? " err" : "");
    clearTimeout(tt);
    tt = setTimeout(() => (t.className = ""), 3200);
  }
  function twice(b, fn) {
    let a = false,
      t;
    const o = b.textContent;
    b.addEventListener("click", () => {
      if (a) {
        clearTimeout(t);
        a = false;
        b.textContent = o;
        fn();
      } else {
        a = true;
        b.textContent = "Yakin hapus?";
        t = setTimeout(() => {
          a = false;
          b.textContent = o;
        }, 3000);
      }
    });
  }
  const fld = (l, i) => h("label", { class: "fld" }, h("span", { text: l }), i);
  async function copy(t) {
    try {
      await navigator.clipboard.writeText(t);
      toast("Tautan disalin");
    } catch (e) {
      toast("Tidak bisa menyalin otomatis. Salin dari tombol Buka.", 1);
    }
  }
  function touch() {
    dirty = true;
    draw();
  }

  /* ---- membangun dokumen lengkap untuk diterbitkan (template dari state, bukan salinan DOM) ---- */
  function doc() {
    const js = SRC.replace(
      /\/\*D\*\/[\s\S]*?\/\*E\*\//,
      () =>
        "/*D*/" +
        JSON.stringify(data).replace(/</g, "\\u003c").replace(/\*\//g, "*\\/") +
        "/*E*/",
    );
    return (
      '<!doctype html>\n<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>' +
      esc(data.judul) +
      '</title><link rel="stylesheet" href="' +
      FONT +
      '"><style id="css">' +
      $("#css").textContent +
      '</style></head><body><div class="strip" aria-hidden="true"></div><main id="app"></main><div id="toast" role="status" aria-live="polite"></div><script>' +
      js +
      "<\/script></body></html>"
    );
  }
  async function pub() {
    try {
      await art.publish(doc());
      dirty = false;
      toast("Diterbitkan. Halaman dimuat ulang…");
    } catch (e) {
      if (e && e.code === "conflict") return;
      if (e && (e.code === "not_writer" || e.code === "not_granted")) {
        canEdit = false;
        manage = false;
        draw();
        toast("Halaman ini hanya bisa diubah oleh editor.", 1);
        return;
      }
      toast(
        "Gagal menerbitkan: " +
          ((e && e.message) || (e && e.code) || "coba lagi"),
        1,
      );
    }
  }

  /* ---- tampilan publik ---- */
  function card(i) {
    const t = TIPE[i.tipe] || TIPE.campuran;
    return h(
      "article",
      { class: "card" },
      h(
        "div",
        { class: "top" },
        h("span", { class: "ic", "aria-hidden": "true", text: t.e }),
        h("span", { class: "tp", text: t.l }),
        i.contoh ? h("span", { class: "ct", text: "Contoh" }) : null,
      ),
      h("h3", { text: i.judul }),
      h("p", {
        class: "mu",
        text: [i.kategori, fdate(i.tanggal), i.jumlah]
          .filter(Boolean)
          .join(" · "),
      }),
      i.deskripsi ? h("p", { class: "ds", text: i.deskripsi }) : null,
      h(
        "div",
        { class: "row" },
        h("a", {
          class: "btn",
          href: i.link,
          target: "_blank",
          rel: "noopener noreferrer",
          text: "Buka di Drive",
        }),
        h("button", {
          type: "button",
          class: "btn alt",
          text: "Salin tautan",
          on: { click: () => copy(i.link) },
        }),
      ),
    );
  }
  function drawList() {
    const cats = [
      ...new Set(data.items.map((i) => i.kategori).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "id"));
    if (kat && !cats.includes(kat)) kat = "";
    const ks = $("#kat");
    ks.replaceChildren(
      h("option", { value: "", text: "Semua kategori" }),
      ...cats.map((c) => h("option", { value: c, text: c })),
    );
    ks.value = kat;
    const L = data.items
      .filter(
        (i) =>
          (!kat || i.kategori === kat) &&
          (!tip || i.tipe === tip) &&
          (i.judul + " " + i.kategori + " " + i.deskripsi)
            .toLowerCase()
            .includes(q),
      )
      .sort(SORT[so]);
    $("#cnt").textContent = data.items.length
      ? L.length + " dari " + data.items.length + " album"
      : "";
    const g = $("#grid");
    g.replaceChildren();
    if (!data.items.length)
      g.append(
        h("div", {
          class: "empty",
          text: canEdit
            ? "Belum ada album. Buka Kelola untuk menambahkan link Drive pertamamu."
            : "Belum ada album yang dipublikasikan.",
        }),
      );
    else if (!L.length)
      g.append(
        h("div", {
          class: "empty",
          text: "Tidak ada album yang cocok dengan pencarianmu.",
        }),
      );
    else L.forEach((i) => g.append(card(i)));
  }

  /* ---- mode Kelola (hanya editor) ---- */
  function drawManage() {
    const p = $("#mp");
    p.replaceChildren();
    p.hidden = !manage;
    if (!manage) return;
    const e = data.items.find((i) => i.id === editId);
    const jd = h("input", { maxlength: 80 }),
      ds = h("input", { maxlength: 200 });
    jd.value = data.judul;
    ds.value = data.deskripsi;
    const fS = h(
      "form",
      {
        on: {
          submit: (ev) => {
            ev.preventDefault();
            data.judul = txt(jd.value, 80) || "Repositori Dokumentasi";
            data.deskripsi = txt(ds.value, 200);
            touch();
          },
        },
      },
      fld("Judul situs", jd),
      fld("Deskripsi singkat", ds),
      h("button", { class: "btn alt", text: "Terapkan" }),
    );
    const j = h("input", { maxlength: 120, required: true }),
      l = h("input", {
        type: "url",
        maxlength: 500,
        required: true,
        placeholder: "https://drive.google.com/drive/folders/…",
      }),
      k = h("input", {
        maxlength: 40,
        list: "kl",
        placeholder: "Contoh: Kegiatan",
      }),
      t = h("input", { type: "date" }),
      n = h("input", { maxlength: 40, placeholder: "Contoh: ±250 foto" }),
      d = h("textarea", { rows: 3, maxlength: 300 });
    const s = h(
      "select",
      {},
      ...Object.keys(TIPE).map((x) =>
        h("option", { value: x, text: TIPE[x].l }),
      ),
    );
    if (e) {
      j.value = e.judul;
      l.value = e.link;
      k.value = e.kategori;
      t.value = e.tanggal;
      n.value = e.jumlah;
      d.value = e.deskripsi;
      s.value = e.tipe;
    }
    const fI = h(
      "form",
      {
        on: {
          submit: (ev) => {
            ev.preventDefault();
            const link = okLink(l.value);
            if (!txt(j.value, 120)) {
              toast("Judul wajib diisi", 1);
              j.focus();
              return;
            }
            if (!link) {
              toast("Link harus diawali https://", 1);
              l.focus();
              return;
            }
            const it = {
              id: e ? e.id : uid(),
              judul: txt(j.value, 120),
              link,
              kategori: txt(k.value, 40),
              tanggal: okDate(t.value),
              tipe: s.value,
              jumlah: txt(n.value, 40),
              deskripsi: txt(d.value, 300),
            };
            if (e) data.items = data.items.map((x) => (x.id === e.id ? it : x));
            else {
              if (data.items.length >= 500) {
                toast("Maksimal 500 album", 1);
                return;
              }
              data.items.unshift(it);
            }
            editId = null;
            touch();
            toast(e ? "Album diperbarui" : "Album ditambahkan");
          },
        },
      },
      fld("Judul album", j),
      fld("Link Google Drive", l),
      h("div", { class: "two" }, fld("Kategori", k), fld("Tanggal", t)),
      h(
        "div",
        { class: "two" },
        fld("Jenis isi", s),
        fld("Jumlah (opsional)", n),
      ),
      fld("Deskripsi", d),
      h(
        "div",
        { class: "actions" },
        h("button", {
          class: "btn",
          text: e ? "Simpan perubahan" : "Tambah album",
        }),
        e
          ? h("button", {
              type: "button",
              class: "btn alt",
              text: "Batal",
              on: {
                click: () => {
                  editId = null;
                  drawManage();
                },
              },
            })
          : null,
      ),
      h(
        "datalist",
        { id: "kl" },
        ...[...new Set(data.items.map((i) => i.kategori).filter(Boolean))].map(
          (c) => h("option", { value: c }),
        ),
      ),
    );
    const bx = h("textarea", {
      rows: 6,
      placeholder:
        "Satu album per baris:\nJudul | https://link-drive | Kategori | 2026-10-12 | foto\n(kategori, tanggal, dan jenis [foto/video/campuran] boleh dikosongkan)",
      maxlength: 60000,
    });
    const fB = h(
      "form",
      {
        on: {
          submit: (ev) => {
            ev.preventDefault();
            let ok = 0;
            const bad = [];
            bx.value.split("\n").forEach((ln, ix) => {
              if (!ln.trim()) return;
              const c = ln.split("|").map((z) => z.trim()),
                link = okLink(c[1] || "");
              if (!c[0] || !link || data.items.length >= 500) {
                bad.push(ix + 1);
                return;
              }
              const tp = (c[4] || "").toLowerCase();
              data.items.push({
                id: uid(),
                judul: txt(c[0], 120),
                link,
                kategori: txt(c[2], 40),
                tanggal: okDate(c[3]),
                tipe: TIPE[tp] ? tp : "campuran",
                jumlah: "",
                deskripsi: "",
              });
              ok++;
            });
            if (ok) {
              bx.value = "";
              touch();
            }
            toast(
              ok +
                " album ditambahkan" +
                (bad.length
                  ? "; baris dilewati: " + bad.slice(0, 10).join(", ")
                  : ""),
              !ok && bad.length,
            );
          },
        },
      },
      fld("Impor banyak link sekaligus", bx),
      h("button", { class: "btn alt", text: "Tambahkan dari daftar" }),
    );
    const list = h(
      "div",
      {},
      ...(data.items.length
        ? data.items.map((i) => {
            const del = h("button", {
              type: "button",
              class: "btn sm alt dg",
              text: "Hapus",
            });
            twice(del, () => {
              data.items = data.items.filter((x) => x.id !== i.id);
              if (editId === i.id) editId = null;
              touch();
            });
            return h(
              "div",
              { class: "pi" },
              h(
                "div",
                {},
                h("b", { text: i.judul }),
                h("p", {
                  class: "mu",
                  text:
                    [
                      TIPE[i.tipe] ? TIPE[i.tipe].l : "",
                      i.kategori,
                      fdate(i.tanggal),
                    ]
                      .filter(Boolean)
                      .join(" · ") + (i.contoh ? " · Contoh" : ""),
                }),
              ),
              h(
                "div",
                { class: "actions" },
                h("button", {
                  type: "button",
                  class: "btn sm alt",
                  text: "Ubah",
                  on: {
                    click: () => {
                      editId = i.id;
                      drawManage();
                      fI.scrollIntoView();
                    },
                  },
                }),
                del,
              ),
            );
          })
        : [h("p", { class: "mu", text: "Belum ada album." })]),
    );
    p.append(
      h(
        "section",
        { class: "panel" },
        h("h2", { text: "Pengaturan situs" }),
        fS,
      ),
      h(
        "section",
        { class: "panel" },
        h("h2", { text: e ? "Ubah album" : "Tambah album" }),
        fI,
      ),
      h("section", { class: "panel" }, h("h2", { text: "Impor massal" }), fB),
      h(
        "section",
        { class: "panel" },
        h("h2", { text: "Semua album (" + data.items.length + ")" }),
        list,
      ),
    );
  }
  function drawPub() {
    const b = $("#pub");
    b.hidden = !(canEdit && manage);
    if (b.hidden) return;
    b.replaceChildren(
      h("span", {
        text: dirty
          ? "Ada perubahan yang belum diterbitkan."
          : "Semua perubahan sudah diterbitkan.",
      }),
      h("button", {
        type: "button",
        class: "btn sm",
        text: "Terbitkan perubahan",
        disabled: !dirty,
        on: { click: pub },
      }),
    );
  }
  function draw() {
    $("#jd").textContent = data.judul;
    $("#ds").textContent = data.deskripsi;
    document.title = data.judul;
    $("#km").hidden = !canEdit;
    $("#km").textContent = manage ? "Tutup Kelola" : "Kelola";
    drawList();
    drawManage();
    drawPub();
  }

  /* ---- kerangka halaman (dibuat sekali) ---- */
  const km = h("button", {
    type: "button",
    class: "btn alt",
    id: "km",
    hidden: true,
    text: "Kelola",
    on: {
      click: () => {
        manage = !manage;
        draw();
      },
    },
  });
  const sq = h("input", {
    type: "search",
    placeholder: "Cari album…",
    "aria-label": "Cari album",
    maxlength: 80,
    on: {
      input: (e) => {
        q = e.target.value.trim().toLowerCase();
        drawList();
      },
    },
  });
  const sk = h("select", {
    id: "kat",
    "aria-label": "Kategori",
    on: {
      change: (e) => {
        kat = e.target.value;
        drawList();
      },
    },
  });
  const st = h(
    "select",
    {
      "aria-label": "Jenis isi",
      on: {
        change: (e) => {
          tip = e.target.value;
          drawList();
        },
      },
    },
    h("option", { value: "", text: "Foto & video" }),
    ...Object.keys(TIPE).map((x) => h("option", { value: x, text: TIPE[x].l })),
  );
  const ss = h(
    "select",
    {
      "aria-label": "Urutkan",
      on: {
        change: (e) => {
          so = e.target.value;
          drawList();
        },
      },
    },
    h("option", { value: "baru", text: "Terbaru" }),
    h("option", { value: "lama", text: "Terlama" }),
    h("option", { value: "nama", text: "Nama A–Z" }),
  );
  $("#app").append(
    h(
      "header",
      {},
      h("h1", { id: "jd" }),
      h("p", { class: "desc", id: "ds" }),
      km,
    ),
    h("div", { id: "mp", hidden: true }),
    h("div", { class: "bar" }, sq, sk, st, ss),
    h("p", { class: "mu", id: "cnt" }),
    h("div", { class: "grid", id: "grid" }),
    h("div", { id: "pub", hidden: true }),
  );
  addEventListener("beforeunload", (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  });
  draw();
  (async () => {
    const use =
      window.claude && window.claude.use
        ? (n) => window.claude.use(n).catch(() => null)
        : async () => null;
    art = await use("artifact");
    const u = await use("user");
    try {
      canEdit = !!(art && u && (await u.canEdit()));
    } catch (e) {
      canEdit = false;
    }
    draw();
  })();
})();
