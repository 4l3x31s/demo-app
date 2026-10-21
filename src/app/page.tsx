"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Channel, NotificationReceipt } from "../lib/notifications";
import { APP_NAME } from "../lib/config";

const channels: { id: Channel; label: string; icon: string; hint: string; recipient: string }[] = [
  { id: "in-app", label: "En la app", icon: "◉", hint: "Comprobante en la bandeja simulada", recipient: "usuario-demo" },
  { id: "email", label: "Correo", icon: "✉", hint: "Comprobante de correo simulado", recipient: "demo@example.com" },
  { id: "sms", label: "SMS", icon: "▤", hint: "Comprobante de SMS simulado", recipient: "+59170000000" },
];

export default function Home() {
  const [channel, setChannel] = useState<Channel>("in-app");
  const [recipient, setRecipient] = useState("usuario-demo");
  const [title, setTitle] = useState("Su espacio de trabajo está listo");
  const [message, setMessage] = useState("Todo está preparado para comenzar. Explore sus canales de comunicación desde un solo lugar.");
  const [history, setHistory] = useState<(NotificationReceipt & { read: boolean })[]>([]);
  const [filter, setFilter] = useState<"all" | Channel>("all");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [openReceipt, setOpenReceipt] = useState<NotificationReceipt | null>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  const selected = channels.find((item) => item.id === channel)!;
  const visible = history.filter((item) => filter === "all" || item.channel === filter);
  const unread = history.filter((item) => item.channel === "in-app" && !item.read).length;

  useEffect(() => {
    if (openReceipt && detailDialog.current && !detailDialog.current.open) {
      detailDialog.current.showModal();
    }
  }, [openReceipt]);

  function openNotification(receipt: NotificationReceipt) {
    setOpenReceipt(receipt);
    if (receipt.channel === "in-app") {
      setHistory((items) => items.map((item) => item.id === receipt.id ? { ...item, read: true } : item));
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/notifications", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, recipient, title, message }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "No se pudo completar la simulación.");
        return;
      }
      setHistory((items) => [{ ...result, read: false }, ...items].slice(0, 100));
      setNotice("Notificación simulada. No se realizó ningún envío externo.");
    } catch {
      setError("No se pudo completar la simulación. Verifique la conexión e intente nuevamente.");
    } finally { setPending(false); }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Inicio del centro de notificaciones"><span className="brand-mark">n<span>·</span></span><span>notifica<span className="brand-light"> / demo</span></span></a>
        <div className="workspace-label">ESPACIO DE TRABAJO</div>
        <a className="nav-item active" href="#playground"><span>▦</span> Simulador <span className="tiny-label">DEMO</span></a>
        <a className="nav-item" href="#activity"><span>◷</span> Actividad <span className="nav-count">{history.length}</span></a>
        <a className="nav-item" href="/architecture.html" target="_blank" rel="noreferrer"><span>◇</span> Arquitectura <span className="arrow">↗</span></a>
        <div className="sidebar-bottom"><span className="avatar">D</span><div>Entorno de demostración<small>Sin credenciales externas</small></div><span className="green-dot" /></div>
      </aside>

      <main id="playground">
        <header className="topbar"><span>Espacio de trabajo <span className="crumb">/</span> <strong>Simulador</strong></span><span className="environment"><span className="green-dot" /> Entorno simulado</span></header>
        <section className="page-heading"><div className="eyebrow">UNA SOLA INTERFAZ. TRES CANALES.</div><h1>Mensajes que conectan.<br /><span>Arquitectura que escala.</span></h1><p>Explore tres canales desde una interfaz común. Componga una notificación<br className="desktop-break" /> y observe cómo el patrón Factory selecciona el notificador.</p><span className="heading-stamp">✦<small>Diseñado para<br />demostrar</small></span></section>

        <section className="stats" aria-label="Indicadores de la sesión">
          <div><span className="stat-icon violet">↗</span><div><small>Simulaciones</small><strong>{history.length.toString().padStart(2, "0")}</strong></div><span className="stat-note">Esta sesión</span></div>
          <div><span className="stat-icon mint">▧</span><div><small>Canales disponibles</small><strong>03</strong></div><span className="stat-note">Sin proveedores</span></div>
          <div><span className="stat-icon peach">◉</span><div><small>Sin leer en la app</small><strong aria-label="Notificaciones sin leer">{unread.toString().padStart(2, "0")}</strong></div><span className="stat-note">Bandeja local</span></div>
        </section>

        <div className="workbench">
          <section className="panel composer"><div className="panel-heading"><div><h2>Crear una notificación</h2><p>Un mensaje, el canal adecuado.</p></div><span className="step-label">01 / CREAR</span></div>
            <form onSubmit={submit}>
              <fieldset disabled={pending}><legend>Seleccionar canal</legend><div className="channel-picker">{channels.map((item) => <button key={item.id} type="button" aria-pressed={channel === item.id} className={channel === item.id ? "channel selected" : "channel"} onClick={() => { setChannel(item.id); setRecipient(item.recipient); setError(""); setNotice(""); }}><span>{item.icon}</span>{item.label}<span className="selection-dot" /></button>)}</div>
                <label htmlFor="recipient">{channel === "email" ? "Correo electrónico" : channel === "sms" ? "Número de teléfono" : "Identificador del destinatario"}</label>
                <input id="recipient" type={channel === "email" ? "email" : channel === "sms" ? "tel" : "text"} value={recipient} onChange={(e) => setRecipient(e.target.value)} maxLength={254} required />
                <label htmlFor="title">Título <span>Breve y claro</span></label><input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
                <label htmlFor="message">Mensaje <span>{message.length} / 1000</span></label><textarea id="message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} required />
                <button className="send-button" type="submit">{pending ? "Simulando…" : "Simular notificación"}<span aria-hidden="true">↗</span></button>
              </fieldset>
              <p className="safe-note">◇ Entorno de prueba. No se enviarán mensajes reales.</p>
              {error && <p role="alert" className="error">{error}</p>}
              <p role="status" className="success">{notice}</p>
            </form>
          </section>

          <div className="preview-column"><section className="preview"><div className="preview-top"><span className="eyebrow">VISTA PREVIA</span><span className="preview-pill">{selected.label}</span></div><div className="preview-stage"><div className="notification-card"><div className="notification-meta"><span className="notification-logo">n·</span><strong>{APP_NAME}</strong><span>Ahora</span></div><h3>{title || "Título de la notificación"}</h3><p>{message || "Su mensaje aparecerá aquí."}</p><div className="preview-recipient">{selected.icon} <span>{recipient || "Destinatario"}</span></div></div></div><p className="preview-caption"><span className="green-dot" /> {selected.hint}</p></section>
            <section className="pattern-card"><span className="pattern-tag">DECISIÓN DE ARQUITECTURA</span><h2>Diferentes canales.<br />Un mismo contrato.</h2><p>La Factory selecciona el notificador. Todos implementan el contrato <code>Notifier</code> con su método <code>send()</code>.</p><div className="code-path"><code>NotificationFactory.create(&quot;{channel}&quot;)</code><span>↓</span><code>{channel === "in-app" ? "InApp" : channel === "email" ? "Email" : "Sms"}Notifier.send()</code></div><a href="/architecture.html" target="_blank" rel="noreferrer">Ver arquitectura animada <span>↗</span></a></section>
          </div>
        </div>

        <section className="panel activity" id="activity"><div className="panel-heading"><div><h2>Actividad reciente <span className="count-badge">{history.length}</span></h2><p>Últimos 100 comprobantes simulados. El historial se borra al recargar.</p></div><button className="text-button" onClick={() => setHistory((items) => items.map((item) => ({ ...item, read: true })))} disabled={unread === 0}>Marcar todo como leído</button></div><div className="filters" aria-label="Filtrar actividad">{(["all", ...channels.map((item) => item.id)] as const).map((id) => <button key={id} aria-pressed={filter === id} className={filter === id ? "filter active-filter" : "filter"} onClick={() => setFilter(id)}>{id === "all" ? "Todos los canales" : channels.find((item) => item.id === id)!.label}</button>)}</div>
          {visible.length === 0 ? <div className="empty-state"><span>⌁</span><h3>Su próxima notificación comienza aquí.</h3><p>{history.length ? "Aún no hay notificaciones en este canal." : "Simule una notificación para ver el resultado."}</p></div> : <ul className="activity-list">{visible.map((item) => <li key={item.id}><span className={`activity-icon ${item.channel === "email" ? "mint" : item.channel === "sms" ? "peach" : "violet"}`}>{channels.find((entry) => entry.id === item.channel)!.icon}</span><div className="activity-content"><h3>{item.title}{item.channel === "in-app" && !item.read && <span className="unread-dot" />}</h3><p>{item.message}</p><small>{item.recipient} · {item.provider} · {new Date(item.createdAt).toLocaleTimeString("es-BO")}</small></div><div className="activity-actions"><span className="status-badge">Simulada</span><button type="button" className="open-notification" aria-label={`Abrir notificación: ${item.title}`} onClick={() => openNotification(item)}>Abrir <span aria-hidden="true">↗</span></button></div></li>)}</ul>}
        </section>
        <footer><span>Next.js · TypeScript · Patrón Factory</span><span>Demostración sin envíos reales. <span aria-hidden="true">✦</span></span></footer>
      </main>
      <dialog ref={detailDialog} className="notification-detail" aria-labelledby="notification-detail-title" aria-describedby="notification-detail-message" onClose={() => setOpenReceipt(null)} onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
      }}>
        {openReceipt && <div className="detail-content">
          <div className="detail-heading"><span className="eyebrow">DETALLE DE LA NOTIFICACIÓN</span><button type="button" className="detail-close" aria-label="Cerrar notificación" onClick={() => detailDialog.current?.close()}>Cerrar <span aria-hidden="true">×</span></button></div>
          <div className="detail-badges"><span className="preview-pill">{channels.find((item) => item.id === openReceipt.channel)?.label}</span><span className="status-badge">Simulada</span></div>
          <h2 id="notification-detail-title">{openReceipt.title}</h2>
          <p id="notification-detail-message" className="detail-message">{openReceipt.message}</p>
          <dl className="detail-metadata"><div><dt>Destinatario</dt><dd>{openReceipt.recipient}</dd></div><div><dt>Simulador</dt><dd>{openReceipt.provider}</dd></div><div><dt>Fecha</dt><dd>{new Date(openReceipt.createdAt).toLocaleString("es-BO")}</dd></div><div><dt>Identificador</dt><dd><code>{openReceipt.id}</code></dd></div></dl>
          <p className="detail-disclaimer">Este comprobante es una simulación. No se realizó ningún envío externo.</p>
        </div>}
      </dialog>
    </div>
  );
}
