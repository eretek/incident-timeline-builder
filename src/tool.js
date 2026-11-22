/*! Eretek Online Araçlar #73 — Güvenlik Olayı Zaman Çizelgesi */
ERT.def('73', {
	pt: function (s, tzMin) {
		s = String(s || '').trim();
		var m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i.exec(s), off = null, a;
		if (m) { a = [+m[1], +m[2], +m[3], +m[4], +m[5], +(m[6] || 0), m[7] ? +(m[7] + '000').slice(0, 3) : 0]; if (m[8]) { off = /z/i.test(m[8]) ? 0 : (m[8][0] === '-' ? -1 : 1) * (+m[8].replace(/[+:-]/g, '').slice(0, 2) * 60 + +m[8].replace(/[+:-]/g, '').slice(2)); } }
		else { m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s); if (!m) { return NaN; } a = [+m[3], +m[2], +m[1], +m[4], +m[5], +(m[6] || 0), 0]; }
		if (a[1] < 1 || a[1] > 12 || a[2] < 1 || a[2] > 31 || a[3] > 23 || a[4] > 59 || a[5] > 60) { return NaN; }
		return Date.UTC(a[0], a[1] - 1, a[2], a[3], a[4], a[5], a[6]) - (off === null ? tzMin : off) * 60000;
	},
	run: function (v, c) {
		var P = ERT.tools['73'].pt, tz = v.tz || '+00:00', tm = /^([+-])(\d{2}):?(\d{2})$/.exec(tz.trim());
		if (!tm) { throw c.fe('tz', 'tzFmt'); }
		var tzMin = (tm[1] === '-' ? -1 : 1) * (+tm[2] * 60 + +tm[3]);
		var r = c.csv(v.csv, 'csv', 20000), H = r.head, col = function (n) { return ERT.csv.col(H, n); };
		var iT = col(['time', 'timestamp', 'zaman', 'zeit', 'date']), iS = col(['source', 'kaynak', 'quelle']), iH = col(['host', 'device', 'cihaz']), iU = col(['user', 'kullanici', 'benutzer', 'account']), iE = col(['event', 'olay', 'ereignis', 'message', 'description']), iP = col(['phase', 'asama', 'phase_']);
		if (iT < 0 || iE < 0) { throw c.fe('csv', 'col', { c: 'time, event' }); }
		var ev = r.rows.map(function (x, i) { var t = P(x[iT], tzMin); if (isNaN(t)) { throw c.fe('csv', 'row', { r: i + 2, t: x[iT] }); } return { t: t, s: iS >= 0 ? x[iS] : '', h: iH >= 0 ? x[iH] : '', u: iU >= 0 ? x[iU] : '', e: x[iE], p: iP >= 0 ? ERT.norm(x[iP]) : '', i: i }; });
		ev.sort(function (a, b) { return a.t - b.t || a.i - b.i; });
		var t0 = ev[0].t, gap = (v.gap || 60) * 60000, rows = [], cls = [], ph = {}, lc = function (t) { return new Date(t + tzMin * 60000).toISOString().slice(0, 19).replace('T', ' '); };
		var phMap = { detect: 'detect', tespit: 'detect', erkennung: 'detect', contain: 'contain', containment: 'contain', izolasyon: 'contain', sinirlama: 'contain', eindammung: 'contain', recover: 'recover', recovery: 'recover', kurtarma: 'recover', wiederherstellung: 'recover', initial: 'initial', ilk: 'initial', erst: 'initial' };
		ev.forEach(function (x, k) {
			var flag = ''; if (k && x.t - ev[k - 1].t > gap) { flag = c.t('gapF', { d: c.dur((x.t - ev[k - 1].t) / 1000) }); }
			var pn = phMap[x.p] || ''; if (pn && ph[pn] === undefined) { ph[pn] = x.t; }
			rows.push([lc(x.t), new Date(x.t).toISOString().slice(0, 19).replace('T', ' ') + 'Z', 'T+' + c.dur((x.t - t0) / 1000), x.s || '–', x.h || '–', x.u || '–', x.e, pn ? c.t('p_' + pn) : (x.p || '–'), flag]); cls.push(flag ? 'warn' : (pn === 'detect' ? 'err' : (pn === 'contain' ? 'warn' : (pn === 'recover' ? 'ok' : ''))));
		});
		var kv = [[c.t('first'), lc(t0) + ' (' + tz + ')'], [c.t('last'), lc(ev[ev.length - 1].t)], [c.t('span'), c.dur((ev[ev.length - 1].t - t0) / 1000)]], vv = { count: ev.length, first: new Date(t0).toISOString(), last: new Date(ev[ev.length - 1].t).toISOString() };
		var st = ph.initial !== undefined ? ph.initial : t0;
		if (ph.detect !== undefined) { kv.push([c.t('ttd'), c.dur((ph.detect - st) / 1000)]); vv.ttdMin = Math.round((ph.detect - st) / 60000); }
		if (ph.contain !== undefined && ph.detect !== undefined) { kv.push([c.t('ttc'), c.dur((ph.contain - ph.detect) / 1000)]); vv.ttcMin = Math.round((ph.contain - ph.detect) / 60000); }
		if (ph.recover !== undefined && ph.detect !== undefined) { kv.push([c.t('ttr'), c.dur((ph.recover - ph.detect) / 1000)]); }
		var nGap = cls.filter(function (x) { return x === 'warn'; }).length;
		var msgs = [['info', c.t('tzNote', { z: tz })], ['info', c.t('phaseNote')], ['info', c.t('local')]];
		var cols = [c.t('c_lt', { z: tz }), 'UTC', 'T+', c.t('c_s'), c.t('c_h'), c.t('c_u'), c.t('c_e'), c.t('c_p'), c.t('c_g')];
		return { big: c.t('big', { n: ev.length, d: c.dur((ev[ev.length - 1].t - t0) / 1000) }), kv: kv, msgs: msgs, tables: [{ cols: cols, rows: rows, cls: cls }], x: { csv: { name: 'incident-timeline', cols: cols, rows: rows } }, v: vv };
	}
});
