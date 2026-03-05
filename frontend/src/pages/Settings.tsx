import { useState, useEffect } from "react";
import { api, type AppSetting, type AlphaplanStatus } from "@/api/client";
import { Settings2, Wifi, WifiOff, Loader2, Save } from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [apStatus, setApStatus] = useState<AlphaplanStatus | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    api.getSettings().then((data) => {
      setSettings(data);
      const vals: Record<string, string> = {};
      data.forEach((s) => {
        vals[s.key] = s.value === "***" ? "" : (s.value || "");
      });
      setValues(vals);
    }).catch(console.error);
  }, []);

  const saveSetting = async (key: string) => {
    setSaving(key);
    setMessage(null);
    try {
      await api.updateSetting(key, values[key] || null);
      setMessage({ type: "success", text: `${key} gespeichert` });
    } catch (e) {
      setMessage({ type: "error", text: e instanceof Error ? e.message : "Fehler beim Speichern" });
    } finally {
      setSaving(null);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setApStatus(null);
    try {
      const status = await api.getAlphaplanStatus();
      setApStatus(status);
    } catch (e) {
      setApStatus({ status: "error", message: e instanceof Error ? e.message : "Fehler" });
    } finally {
      setTesting(false);
    }
  };

  const alphaplanSettings = settings.filter((s) => s.key.startsWith("alphaplan_"));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Einstellungen</h1>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Alphaplan Settings */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Settings2 className="h-5 w-5" />
            Alphaplan REST API
          </h2>
          <button
            onClick={testConnection}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-accent"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : apStatus?.status === "ok" ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            Verbindung testen
          </button>
        </div>

        {apStatus && (
          <div
            className={`mx-6 mt-4 rounded-lg px-4 py-3 text-sm ${
              apStatus.status === "ok"
                ? "bg-green-500/10 text-green-500"
                : apStatus.status === "disabled"
                  ? "bg-yellow-500/10 text-yellow-500"
                  : "bg-red-500/10 text-red-500"
            }`}
          >
            {apStatus.message}
          </div>
        )}

        <div className="space-y-4 p-6">
          {alphaplanSettings.map((setting) => (
            <div key={setting.key} className="flex items-end gap-3">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  {setting.description || setting.key}
                </label>
                {setting.key === "alphaplan_rest_enabled" ? (
                  <select
                    value={values[setting.key] || "false"}
                    onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="true">Aktiviert</option>
                    <option value="false">Deaktiviert</option>
                  </select>
                ) : (
                  <input
                    type={setting.is_secret ? "password" : "text"}
                    value={values[setting.key] || ""}
                    onChange={(e) => setValues({ ...values, [setting.key]: e.target.value })}
                    placeholder={setting.is_secret ? "••••••••" : ""}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                )}
              </div>
              <button
                onClick={() => saveSetting(setting.key)}
                disabled={saving === setting.key}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving === setting.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
