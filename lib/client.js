window.__ModuleLoader__.load({
	id: "dsh-git-review",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/icons.tsx
		function RefreshIcon({ size = 14 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("path", { d: "M13.5 8a5.5 5.5 0 1 1-1.6-3.9" }), (0, react_jsx_runtime.jsx)("path", { d: "M13.7 1.8v2.7h-2.7" })]
			});
		}
		function ExpandIcon({ size = 14 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("path", { d: "m4.5 3.5 3.5 3.5 3.5-3.5" }), (0, react_jsx_runtime.jsx)("path", { d: "M3.5 12.5h9" })]
			});
		}
		function CollapseIcon({ size = 14 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("path", { d: "M3.5 3.5h9" }), (0, react_jsx_runtime.jsx)("path", { d: "m4.5 12.5 3.5-3.5 3.5 3.5" })]
			});
		}
		function ChevronIcon({ size = 12, rotated = false }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4",
				"aria-hidden": "true",
				style: {
					transform: rotated ? "rotate(90deg)" : void 0,
					transition: "transform 120ms ease"
				},
				children: (0, react_jsx_runtime.jsx)("path", { d: "m5.5 3.5 4.5 4.5-4.5 4.5" })
			});
		}
		function PopupIcon({ size = 12, open = false }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4",
				"aria-hidden": "true",
				style: {
					transform: open ? "rotate(-90deg)" : "rotate(90deg)",
					transition: "transform 120ms ease"
				},
				children: (0, react_jsx_runtime.jsx)("path", { d: "m5.5 3.5 4.5 4.5-4.5 4.5" })
			});
		}
		function SearchIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("circle", {
					cx: "7",
					cy: "7",
					r: "4.4"
				}), (0, react_jsx_runtime.jsx)("path", { d: "m10.4 10.4 3.4 3.4" })]
			});
		}
		function BranchIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "4.5",
						cy: "3.5",
						r: "1.6"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "4.5",
						cy: "12.5",
						r: "1.6"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "11.5",
						cy: "3.5",
						r: "1.6"
					}),
					(0, react_jsx_runtime.jsx)("path", { d: "M4.5 5.1v5.8" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M11.5 5.1v1.4a2 2 0 0 1-2 2h-5" })
				]
			});
		}
		function CommitIcon({ size = 14 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("circle", {
					cx: "8",
					cy: "8",
					r: "2.6"
				}), (0, react_jsx_runtime.jsx)("path", { d: "M1.5 8h3.9M10.6 8h3.9" })]
			});
		}
		function CommentIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.2",
				"aria-hidden": "true",
				children: (0, react_jsx_runtime.jsx)("path", {
					d: "M2.5 3.5h11v7h-6l-3 3v-3h-2z",
					strokeLinejoin: "round"
				})
			});
		}
		function GraphIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "4",
						cy: "3.5",
						r: "1.5"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "4",
						cy: "12.5",
						r: "1.5"
					}),
					(0, react_jsx_runtime.jsx)("circle", {
						cx: "11.5",
						cy: "8",
						r: "1.5"
					}),
					(0, react_jsx_runtime.jsx)("path", { d: "M4 5v6" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M4 8h5.5" })
				]
			});
		}
		function TagIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("path", {
					d: "M2.2 2.6v4.3l6.1 6.1 4.9-4.9-6.1-6.1H3.2z",
					strokeLinejoin: "round"
				}), (0, react_jsx_runtime.jsx)("circle", {
					cx: "4.9",
					cy: "4.9",
					r: "1"
				})]
			});
		}
		function FileIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("path", {
					d: "M3.5 2.5h6l3 3v8h-9z",
					strokeLinejoin: "round"
				}), (0, react_jsx_runtime.jsx)("path", { d: "M9.5 2.5v3h3" })]
			});
		}
		function CopyIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("rect", {
					x: "5.5",
					y: "5.5",
					width: "8",
					height: "8",
					rx: "1.5"
				}), (0, react_jsx_runtime.jsx)("path", { d: "M10.5 5.5v-2a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v5.5a1 1 0 0 0 1 1h2" })]
			});
		}
		function TrashIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [
					(0, react_jsx_runtime.jsx)("path", { d: "M2.5 4.5h11" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M5.5 4.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M3.5 4.5 4.4 13a1.5 1.5 0 0 0 1.5 1.4h4.2a1.5 1.5 0 0 0 1.5-1.4l.9-8.5" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M6.5 7.5v4M9.5 7.5v4" })
				]
			});
		}
		function PencilIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("path", {
					d: "m10.8 2.8 2.4 2.4-7.6 7.6-3 .6.6-3z",
					strokeLinejoin: "round"
				}), (0, react_jsx_runtime.jsx)("path", { d: "m9.6 4 2.4 2.4" })]
			});
		}
		function OpenIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [
					(0, react_jsx_runtime.jsx)("path", { d: "M8 2.5H4a1.5 1.5 0 0 0-1.5 1.5v8A1.5 1.5 0 0 0 4 13.5h8a1.5 1.5 0 0 0 1.5-1.5V8" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M10.5 2.5h3v3" }),
					(0, react_jsx_runtime.jsx)("path", { d: "M13.2 2.8 8.5 7.5" })
				]
			});
		}
		function FolderIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: (0, react_jsx_runtime.jsx)("path", {
					d: "M1.8 4.5a1 1 0 0 1 1-1h3.4l1.6 1.7h5.4a1 1 0 0 1 1 1v6.3a1 1 0 0 1-1 1H2.8a1 1 0 0 1-1-1z",
					strokeLinejoin: "round"
				})
			});
		}
		function CheckIcon({ size = 12 }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.5",
				"aria-hidden": "true",
				children: (0, react_jsx_runtime.jsx)("path", { d: "m3 8.5 3.2 3.2L13 4.5" })
			});
		}
		function LineLeftIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("rect", {
					x: "2",
					y: "2.5",
					width: "4.5",
					height: "11",
					rx: "1"
				}), (0, react_jsx_runtime.jsx)("rect", {
					x: "9.5",
					y: "2.5",
					width: "4.5",
					height: "11",
					rx: "1"
				})]
			});
		}
		function LinesIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: (0, react_jsx_runtime.jsx)("path", { d: "M2.5 4h11M2.5 8h11M2.5 12h11" })
			});
		}
		function SwapIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("path", {
					d: "M4 5.5h8.5M10 3l2.7 2.5L10 8",
					strokeLinejoin: "round",
					strokeLinecap: "round"
				}), (0, react_jsx_runtime.jsx)("path", {
					d: "M12 10.5H3.5M6 13l-2.7-2.5L6 8",
					strokeLinejoin: "round",
					strokeLinecap: "round"
				})]
			});
		}
		function HistoryIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [
					(0, react_jsx_runtime.jsx)("path", {
						d: "M2.5 8a5.5 5.5 0 1 0 1.6-3.9",
						strokeLinecap: "round"
					}),
					(0, react_jsx_runtime.jsx)("path", {
						d: "M2.3 1.8v2.7h2.7",
						strokeLinejoin: "round",
						strokeLinecap: "round"
					}),
					(0, react_jsx_runtime.jsx)("path", {
						d: "M8 5v3.2l2.2 1.3",
						strokeLinecap: "round"
					})
				]
			});
		}
		function PlusIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4",
				"aria-hidden": "true",
				children: (0, react_jsx_runtime.jsx)("path", {
					d: "M8 3v10M3 8h10",
					strokeLinecap: "round"
				})
			});
		}
		function MinusIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsx)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.4",
				"aria-hidden": "true",
				children: (0, react_jsx_runtime.jsx)("path", {
					d: "M3 8h10",
					strokeLinecap: "round"
				})
			});
		}
		function UndoIcon({ size = 13 }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: size,
				height: size,
				viewBox: "0 0 16 16",
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.3",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("path", {
					d: "M3 4v4h4",
					strokeLinejoin: "round",
					strokeLinecap: "round"
				}), (0, react_jsx_runtime.jsx)("path", {
					d: "M3.2 7.5a5.2 5.2 0 1 1-1 4.2",
					strokeLinecap: "round"
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:src/client/review.module.css.mjs
		const css = ".review-module_root{box-sizing:border-box;width:100%;height:100%;min-height:0;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1);--dsw-alias-border-secondary:var(--dsw-alias-border-l2);--dsw-alias-border-primary:var(--dsw-alias-border-l3);--dsw-alias-fill-hover:var(--dsw-alias-interactive-bg-hover);--dsw-alias-fill-active:var(--dsw-alias-interactive-bg-active);--dsh-review-bottom-clearance:calc(var(--dsh-composer-height,152px) + 16px);flex-direction:column;display:flex;position:relative;overflow:hidden}.review-module_centered{justify-content:center;align-items:center;gap:10px;display:flex}body[data-dsh-bg-glass] .review-module_root{background-color:#0000}.review-module_toolbar{z-index:30;border-bottom:1px solid var(--dsw-alias-border-l2);box-shadow:0 1px 2px color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);flex-direction:column;flex:none;gap:6px;padding:7px 12px 8px;display:flex;position:relative}.review-module_tbDivider{background:var(--dsw-alias-border-l4);flex:none;align-self:center;width:1px;height:15px}.review-module_toolbarRow{flex-flow:wrap;flex:none;align-items:center;gap:6px 8px;min-height:26px;display:flex}.review-module_compareCluster{flex:none;align-items:center;gap:8px;display:inline-flex}.review-module_rangeChip{max-width:430px}.review-module_compareRow{flex:none;align-items:center;gap:6px;display:inline-flex}.review-module_compareFixed{border:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-secondary);white-space:nowrap;border-radius:999px;flex:none;align-items:center;gap:5px;padding:3px 9px;font-size:12px;display:inline-flex}.review-module_compareArrow{color:var(--dsw-alias-label-tertiary);white-space:nowrap;font-size:11.5px}.review-module_swapBtn{width:22px;height:22px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:1px solid #0000;border-radius:999px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.review-module_swapBtn:hover{border-color:var(--dsw-alias-border-secondary);background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary)}.review-module_pickerWrap{flex:none;display:inline-flex;position:relative}.review-module_pickerBtn{border:1px solid var(--dsw-alias-border-secondary);max-width:220px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;background:0 0;border-radius:999px;align-items:center;gap:5px;padding:3px 9px;font-size:12px;display:inline-flex;overflow:hidden}.review-module_pickerBtn:hover,.review-module_pickerBtnOpen{background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary)}.review-module_pickerBtnOpen{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, var(--dsw-alias-border-secondary))}.review-module_pickerBtnText{text-overflow:ellipsis;min-width:0;overflow:hidden}.review-module_pickerPop{z-index:60;border:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-bg-layer-1);width:340px;max-width:calc(100vw - 48px);max-height:420px;box-shadow:0 8px 24px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);border-radius:8px;flex-direction:column;display:flex;position:absolute;top:calc(100% + 6px);left:0}.review-module_pickerSearchWrap{border-bottom:1px solid var(--dsw-alias-border-secondary);flex:none;padding:8px}.review-module_pickerSearch{box-sizing:border-box;border:1px solid var(--dsw-alias-border-secondary);width:100%;color:var(--dsw-alias-label-primary);background:0 0;border-radius:6px;outline:none;padding:5px 8px;font-size:12.5px}.review-module_pickerSearch:focus{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, var(--dsw-alias-border-secondary))}.review-module_pickerSearch::placeholder{color:var(--dsw-alias-label-tertiary)}.review-module_pickerScroll{flex:1;min-height:0;padding:4px;overflow:auto}.review-module_pickerGroupLabel{color:var(--dsw-alias-label-tertiary);letter-spacing:.04em;padding:6px 8px 3px;font-size:10.5px;font-weight:600}.review-module_pickerItem{width:100%;min-width:0;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:0 0;border:none;border-radius:6px;align-items:center;gap:6px;padding:4px 8px;font-size:12.5px;display:flex}.review-module_pickerItem:hover:not(:disabled){background:var(--dsw-alias-fill-hover)}.review-module_pickerItem:disabled{opacity:.45;cursor:not-allowed}.review-module_pickerItemActive{background:var(--dsw-alias-fill-active)}.review-module_pickerItemIcon{color:var(--dsw-alias-label-tertiary);flex:none;display:inline-flex}.review-module_pickerItemName{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.review-module_pickerItemMeta{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap;flex:none;font-size:11px}.review-module_pickerItemCheck{color:var(--dsw-alias-state-success-primary);flex:none;display:inline-flex}.review-module_pickerEmpty{color:var(--dsw-alias-label-tertiary);padding:8px;font-size:12px}.review-module_totals{font-variant-numeric:tabular-nums;white-space:nowrap;flex:none;align-items:center;gap:8px;font-size:12px;display:inline-flex}.review-module_totalAdded{color:var(--dsw-alias-state-success-primary);font-weight:600}.review-module_totalDeleted{color:var(--dsw-alias-state-error-primary);font-weight:600}.review-module_fileCount{color:var(--dsw-alias-label-tertiary);white-space:nowrap}.review-module_searchBox{border:1px solid var(--dsw-alias-border-l2);background:color-mix(in srgb, var(--dsw-alias-fill-hover) 75%, transparent);min-width:0;color:var(--dsw-alias-label-tertiary);border-radius:8px;flex:1;align-items:center;gap:6px;padding:4px 9px;display:inline-flex}.review-module_searchBox:focus-within{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, var(--dsw-alias-border-l2));background:var(--dsw-alias-bg-layer-1)}.review-module_searchInput{width:auto;min-width:60px;color:var(--dsw-alias-label-primary);background:0 0;border:none;outline:none;flex:1;font-size:12px}.review-module_searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}.review-module_searchMeta{color:var(--dsw-alias-label-tertiary);white-space:nowrap;font-variant-numeric:tabular-nums;font-size:11px}.review-module_searchWrap{flex:280px;align-items:center;gap:4px;min-width:200px;display:inline-flex;position:relative}.review-module_searchScope{flex:none;display:inline-flex;position:relative}.review-module_searchScopeBtn{border:none;border-right:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;background:0 0;border-radius:0;align-self:stretch;align-items:center;gap:4px;margin-right:2px;padding:0 8px 0 2px;font-size:12px;display:inline-flex}.review-module_searchScopeBtn:hover{color:var(--dsw-alias-label-primary)}.review-module_searchOptionsPop{z-index:60;border:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-bg-layer-1);width:230px;max-width:calc(100vw - 48px);box-shadow:0 8px 24px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);border-radius:8px;flex-direction:column;padding:4px;display:flex;position:absolute;top:calc(100% + 6px);left:0}.review-module_searchOptionsGroup{color:var(--dsw-alias-label-tertiary);letter-spacing:.04em;padding:6px 8px 3px;font-size:10.5px;font-weight:600}.review-module_searchFlag{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent);color:var(--dsw-alias-state-business-primary);white-space:nowrap;border-radius:999px;flex:none;padding:0 5px;font-size:10px;font-weight:600}.review-module_matchNav{flex:none;align-items:center;gap:2px;display:inline-flex}.review-module_matchCount{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap;font-size:11px}.review-module_matchChip{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent);color:var(--dsw-alias-state-business-primary);font-variant-numeric:tabular-nums;border-radius:999px;flex:none;padding:1px 6px;font-size:10.5px;line-height:1.4}.review-module_matchMark{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 32%, transparent);color:inherit;border-radius:2px;padding:0 1px}.review-module_rowMatchActive{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:-1px}.review-module_toolBtn{border:1px solid var(--dsw-alias-border-secondary);color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;white-space:nowrap;background:0 0;border-radius:6px;flex:none;align-items:center;gap:5px;padding:4px 8px;font-size:12px;display:inline-flex}.review-module_toolBtn:hover:not(:disabled){background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary);border-color:color-mix(in srgb, var(--dsw-alias-label-primary) 22%, var(--dsw-alias-border-secondary))}.review-module_toolBtn:focus-visible,.review-module_pickerBtn:focus-visible,.review-module_commitBtn:focus-visible,.review-module_commitToggle:focus-visible,.review-module_branchBtn:focus-visible,.review-module_branchIconBtn:focus-visible,.review-module_branchNameBtn:focus-visible,.review-module_graphToggle:focus-visible,.review-module_gapBar:focus-visible,.review-module_rowCommentBtn:focus-visible,.review-module_fileRow:focus-visible,.review-module_dirRow:focus-visible,.review-module_commitRow:focus-visible{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:1px}.review-module_iconBtn{width:26px;height:26px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:1px solid #0000;border-radius:6px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex;position:relative}.review-module_iconBtn:hover:not(:disabled){background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary);border-color:color-mix(in srgb, var(--dsw-alias-label-primary) 22%, var(--dsw-alias-border-secondary))}.review-module_iconBtn:disabled{opacity:.5;cursor:not-allowed}.review-module_iconBtnSpinning svg{animation:.9s linear infinite review-module_review-spin}@keyframes review-module_review-spin{to{transform:rotate(360deg)}}.review-module_iconBtnBadge{background:var(--dsw-alias-state-business-primary);min-width:14px;height:14px;color:var(--dsw-alias-bg-layer-1);font-variant-numeric:tabular-nums;border-radius:999px;justify-content:center;align-items:center;padding:0 3px;font-size:9.5px;font-weight:700;line-height:1;display:inline-flex;position:absolute;top:-5px;right:-5px}.review-module_commitToggle{border:1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, transparent);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent);color:var(--dsw-alias-state-business-primary);cursor:pointer;white-space:nowrap;border-radius:6px;flex:none;align-items:center;gap:5px;padding:3px 10px;font-size:12px;display:inline-flex}.review-module_commitToggle:hover:not(:disabled){border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent)}.review-module_fileMenuPop{z-index:90;border:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-bg-layer-1);max-height:60vh;box-shadow:0 8px 24px color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent);border-radius:8px;flex-direction:column;gap:2px;padding:6px;display:flex;position:fixed;overflow:auto}.review-module_fileMenuTitle{border-bottom:1px solid var(--dsw-alias-border-secondary);color:var(--dsw-alias-label-secondary);text-overflow:ellipsis;white-space:nowrap;padding:4px 8px 6px;font-size:11.5px;font-weight:600;overflow:hidden}.review-module_fileMenuApps{flex-direction:column;gap:2px;display:flex}.review-module_fileMenuItem{width:100%;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:0 0;border:none;border-radius:6px;align-items:center;gap:7px;padding:5px 8px;font-size:12.5px;display:flex}.review-module_fileMenuItem:hover{background:var(--dsw-alias-fill-hover)}.review-module_fileMenuItemIcon{color:var(--dsw-alias-label-tertiary);flex:none;display:inline-flex}.review-module_fileMenuDanger:hover{color:var(--dsw-alias-state-error-primary)}.review-module_fileMenuDivider{background:var(--dsw-alias-border-secondary);height:1px;margin:4px 2px}.review-module_fileMenuRenamePath,.review-module_fileMenuDeletePath{color:var(--dsw-alias-label-tertiary);font-size:11.5px;font-family:var(--ds-font-family-code,ui-monospace, monospace);word-break:break-all;padding:2px 8px}.review-module_fileMenuActions{gap:6px;padding:6px 0 2px;display:flex}.review-module_pickerItemDisabled{opacity:.5}.review-module_conflictBar{border-bottom:1px solid color-mix(in srgb, var(--dsw-alias-state-warning-primary,var(--dsw-alias-state-error-primary)) 40%, var(--dsw-alias-border-secondary));background:color-mix(in srgb, var(--dsw-alias-state-warning-primary,var(--dsw-alias-state-error-primary)) 10%, transparent);color:var(--dsw-alias-label-primary);flex-flow:wrap;flex:none;align-items:center;gap:6px 10px;padding:6px 12px;font-size:12px;display:flex}.review-module_conflictText{flex:1;min-width:200px;font-weight:600}.review-module_body{flex-direction:row;flex:1;min-height:0;display:flex}.review-module_treePanel{border-left:1px solid var(--dsw-alias-border-secondary);flex-direction:column;flex:none;width:clamp(200px,26%,280px);min-height:0;display:flex}.review-module_treePending{border-bottom:1px dashed var(--dsw-alias-border-secondary);color:var(--dsw-alias-state-business-primary);flex:none;padding:6px 12px;font-size:12px}.review-module_viewedDot{border:1.5px solid var(--dsw-alias-border-secondary);color:#0000;cursor:pointer;user-select:none;border-radius:50%;flex:none;justify-content:center;align-items:center;width:14px;height:14px;margin-right:5px;font-size:10px;line-height:1;display:inline-flex}.review-module_viewedDot:hover{border-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-label-tertiary)}.review-module_viewedDotDone{border-color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 22%, transparent);color:var(--dsw-alias-state-success-primary)}.review-module_treeModeRow{flex-direction:row;flex:none;align-items:center;padding:7px 10px;display:flex}.review-module_filterRow{border:1px solid var(--dsw-alias-border-secondary);background:color-mix(in srgb, var(--dsw-alias-fill-hover) 55%, transparent);height:32px;color:var(--dsw-alias-label-tertiary);border-radius:6px;flex-direction:row;flex:none;align-items:center;gap:6px;margin:6px 8px 0;padding:0 8px;display:flex}.review-module_filterRow:focus-within{border-color:color-mix(in srgb, var(--dsw-alias-state-business-primary) 55%, var(--dsw-alias-border-secondary));background:0 0}.review-module_filterInput{min-width:0;color:var(--dsw-alias-label-primary);background:0 0;border:none;outline:none;flex:1;font-size:12.5px}.review-module_filterInput::placeholder{color:var(--dsw-alias-label-tertiary)}.review-module_treeScroll{min-height:0;padding:4px 0 var(--dsh-review-bottom-clearance,140px);scroll-padding-bottom:var(--dsh-review-bottom-clearance,140px);flex:1;overflow:auto}.review-module_treeEmpty{color:var(--dsw-alias-label-tertiary);padding:18px 12px;font-size:12.5px}.review-module_dirRow,.review-module_fileRow{width:100%;height:26px;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:0 0;border:none;flex-direction:row;align-items:center;gap:6px;padding:0 8px;font-size:12.5px;display:flex}.review-module_dirRow:hover,.review-module_fileRow:hover{background:var(--dsw-alias-fill-hover)}.review-module_fileRowActive{background:var(--dsw-alias-fill-active)}.review-module_dirName{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.review-module_dirCount{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11px}.review-module_fileName{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.review-module_badge{border-radius:4px;flex:none;justify-content:center;align-items:center;width:16px;height:16px;font-size:10.5px;font-weight:700;line-height:1;display:inline-flex}.review-module_badgeSuccess{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 16%, transparent)}.review-module_badgeBusiness{color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent)}.review-module_badgeError{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 16%, transparent)}.review-module_badgeMuted{color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-fill-hover)}.review-module_mainPane{flex-direction:column;flex:1;min-width:0;min-height:0;display:flex}.review-module_diffPane{flex-direction:column;flex:1;min-height:0;display:flex}.review-module_diffHeader{border-bottom:1px solid var(--dsw-alias-border-secondary);flex-flow:wrap;flex:none;align-items:center;gap:4px 8px;padding:7px 12px;display:flex}.review-module_diffPath{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:12.5px;font-weight:600;overflow:hidden}.review-module_diffRename{color:var(--dsw-alias-label-tertiary);white-space:nowrap;text-overflow:ellipsis;font-size:11.5px;overflow:hidden}.review-module_diffHeaderSpacer{flex:1}.review-module_chip{background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-secondary);white-space:nowrap;border-radius:999px;flex:none;padding:2px 7px;font-size:10.5px}.review-module_scopeSwitch{border:1px solid var(--dsw-alias-border-secondary);background:color-mix(in srgb, var(--dsw-alias-fill-hover) 60%, transparent);border-radius:6px;flex:none;align-items:center;display:inline-flex;overflow:hidden}.review-module_scopeBtn{color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;background:0 0;border:none;flex:none;align-items:center;gap:4px;padding:3px 9px;font-size:11.5px;display:inline-flex}.review-module_scopeBtn+.review-module_scopeBtn{border-left:1px solid var(--dsw-alias-border-secondary)}.review-module_scopeBtn:hover{background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary)}.review-module_scopeBtnActive{background:var(--dsw-alias-fill-active);color:var(--dsw-alias-label-primary)}.review-module_scopeBtn:disabled{cursor:default;color:var(--dsw-alias-label-tertiary)}.review-module_scopeBtn:disabled:hover{background:0 0}.review-module_toolBtnActive{background:var(--dsw-alias-fill-active);color:var(--dsw-alias-label-primary)}.review-module_noticeRow{border-bottom:1px dashed var(--dsw-alias-border-secondary);color:var(--dsw-alias-state-business-primary);flex:none;padding:6px 12px;font-size:12px}.review-module_diffScroll{min-height:0;scroll-padding-bottom:var(--dsh-review-bottom-clearance,140px);font-family:var(--ds-font-family-code,ui-monospace, monospace);flex:1;font-size:12px;line-height:1.55;overflow:auto}.review-module_hunkHeader{background:var(--dsw-alias-markdown-code-block);color:var(--dsw-alias-label-secondary);user-select:none;justify-content:space-between;align-items:center;gap:8px;padding:2px 8px 2px 12px;display:flex}.review-module_hunkHeaderText{white-space:pre-wrap;word-break:break-word;min-width:0}.review-module_hunkActions{flex:none;align-items:center;gap:4px;display:inline-flex}.review-module_hunkOpBtn{border:1px solid var(--dsw-alias-border-secondary);color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;background:0 0;border-radius:999px;flex:none;padding:1px 7px;font-size:10.5px;line-height:1.5}.review-module_hunkOpBtn:hover:not(:disabled){background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary);border-color:color-mix(in srgb, var(--dsw-alias-label-primary) 22%, var(--dsw-alias-border-secondary))}.review-module_hunkOpBtn:disabled{opacity:.5;cursor:not-allowed}.review-module_hunkOpDanger:hover:not(:disabled){color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 45%, var(--dsw-alias-border-secondary))}.review-module_hunkOpArmed{background:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-bg-layer-1)}.review-module_hunkOpArmed:hover:not(:disabled){background:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-bg-layer-1)}.review-module_noticeError{color:var(--dsw-alias-state-error-primary);white-space:pre-wrap}.review-module_gapBar{width:100%;color:var(--dsw-alias-label-tertiary);text-align:center;cursor:pointer;user-select:none;background:0 0;border:none;padding:3px 12px;font-family:inherit;font-size:11.5px;font-style:italic;display:block}.review-module_gapBar:hover{background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-secondary)}.review-module_row{grid-template-columns:44px minmax(0,1fr) 44px minmax(0,1fr);min-width:0;display:grid;position:relative}.review-module_rowCommentBtn{z-index:2;border:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-bg-layer-1);width:20px;height:20px;color:var(--dsw-alias-label-tertiary);cursor:pointer;opacity:0;border-radius:4px;justify-content:center;align-items:center;padding:0;transition:opacity .12s;display:inline-flex;position:absolute;top:50%;right:6px;transform:translateY(-50%)}.review-module_row:hover .review-module_rowCommentBtn{opacity:1}.review-module_rowCommentBtn:hover{background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary)}.review-module_commentEditor{border-top:1px dashed var(--dsw-alias-border-secondary);border-bottom:1px dashed var(--dsw-alias-border-secondary);background:var(--dsw-alias-fill-hover);flex-direction:column;gap:6px;padding:8px 12px;display:flex}.review-module_commentTextarea{box-sizing:border-box;border:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-bg-layer-1);width:100%;min-height:44px;color:var(--dsw-alias-label-primary);resize:vertical;border-radius:6px;padding:6px 8px;font-family:inherit;font-size:12.5px}.review-module_commentActions{align-items:center;gap:6px;display:flex}.review-module_commentLine{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11px}.review-module_commitToggle:disabled{opacity:.5;cursor:not-allowed}.review-module_branchBtn{border:1px solid var(--dsw-alias-border-secondary);max-width:200px;color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;background:0 0;border-radius:999px;flex:none;align-items:center;gap:5px;padding:4px 9px;font-size:12px;display:inline-flex;overflow:hidden}.review-module_branchBtn:hover{background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary)}.review-module_abCount{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 16%, transparent);color:var(--dsw-alias-state-business-primary);font-variant-numeric:tabular-nums;white-space:nowrap;border-radius:999px;flex:none;padding:0 5px;font-size:10.5px;font-weight:600;line-height:1.5}.review-module_branchFetchRow{flex:none;justify-content:flex-end;display:flex}.review-module_stashSection{border-top:.5px solid var(--dsw-alias-border-l2);flex:none;align-items:center;gap:8px;padding:6px 2px 0;display:flex}.review-module_stashToggle{color:var(--dsw-alias-label-secondary);cursor:pointer;text-align:left;background:0 0;border:none;flex:1;align-items:center;gap:5px;padding:3px 2px;font-size:12px;display:inline-flex}.review-module_stashToggle:hover{color:var(--dsw-alias-label-primary)}.review-module_stashList{flex-direction:column;min-height:0;max-height:200px;display:flex;overflow:auto}.review-module_stashRow{align-items:center;gap:6px;padding:6px 0;display:flex}.review-module_stashRow+.review-module_stashRow{border-top:.5px solid var(--dsw-alias-border-l2)}.review-module_stashRowText{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.review-module_branchPop{z-index:40;border:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-bg-layer-1);width:360px;max-width:calc(100% - 24px);max-height:min(60vh,420px);box-shadow:0 8px 24px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);border-radius:8px;flex-direction:column;gap:8px;padding:10px;display:flex;position:absolute;top:calc(100% + 6px);left:12px}.review-module_branchCreateRow{flex:none;align-items:center;gap:6px;display:flex}.review-module_branchNameInput{border:1px solid var(--dsw-alias-border-secondary);min-width:0;color:var(--dsw-alias-label-primary);background:0 0;border-radius:6px;flex:1;padding:5px 8px;font-size:12.5px}.review-module_branchNameInput::placeholder{color:var(--dsw-alias-label-tertiary)}.review-module_branchListScroll{flex:1;min-height:0;overflow:auto}.review-module_branchGroupLabel{color:var(--dsw-alias-label-tertiary);padding:2px 4px 4px;font-size:11px}.review-module_branchRow{border-radius:6px;align-items:center;gap:4px;min-height:28px;padding:0 4px;font-size:12.5px;display:flex}.review-module_branchRow:hover{background:var(--dsw-alias-fill-hover)}.review-module_branchRowCurrent{background:var(--dsw-alias-fill-active)}.review-module_branchRowRemote{color:var(--dsw-alias-label-tertiary);background:0 0}.review-module_branchCurrentMark{color:var(--dsw-alias-state-success-primary);flex:none;font-size:12px}.review-module_branchNameBtn{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:inherit;font-size:inherit;text-align:left;cursor:pointer;background:0 0;border:none;flex:1;padding:3px 2px;overflow:hidden}.review-module_branchNameBtn:disabled{cursor:default}.review-module_branchIconBtn{border:1px solid var(--dsw-alias-border-secondary);min-width:24px;height:24px;color:var(--dsw-alias-label-tertiary);cursor:pointer;white-space:nowrap;background:0 0;border-radius:5px;flex:none;justify-content:center;align-items:center;padding:0 5px;font-size:11.5px;display:inline-flex}.review-module_branchIconBtn:hover:not(:disabled){background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary)}.review-module_branchIconBtn:disabled{opacity:.5;cursor:not-allowed}.review-module_branchDanger:hover:not(:disabled){color:var(--dsw-alias-state-error-primary)}.review-module_branchRemoteDetails{color:var(--dsw-alias-label-tertiary);margin-top:4px;font-size:12px}.review-module_branchRemoteDetails summary{cursor:pointer;padding:2px 4px}.review-module_commitPop{z-index:40;border:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-bg-layer-1);width:340px;max-width:calc(100% - 24px);box-shadow:0 8px 24px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);border-radius:8px;flex-direction:column;gap:8px;padding:10px;display:flex;position:absolute;top:calc(100% + 6px);right:12px}.review-module_draftPop{max-width:calc(100% - 24px);max-height:420px}.review-module_draftHead{color:var(--dsw-alias-label-primary);flex:none;justify-content:space-between;align-items:center;font-size:12.5px;font-weight:600;display:flex}.review-module_draftClear{color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;padding:0;font-size:11.5px}.review-module_draftClear:hover{color:var(--dsw-alias-state-error-primary)}.review-module_draftEmpty{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}.review-module_draftList{flex-direction:column;min-height:0;display:flex;overflow:auto}.review-module_draftRow{align-items:flex-start;gap:8px;padding:8px 0;display:flex}.review-module_draftRow+.review-module_draftRow{border-top:.5px solid var(--dsw-alias-border-l2)}.review-module_draftRowText{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.review-module_draftRowPath{color:var(--dsw-alias-state-business-primary);font-family:var(--dsw-font-mono,ui-monospace, monospace);font-size:11.5px}.review-module_draftRowBody{color:var(--dsw-alias-label-primary);white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;line-height:1.5}.review-module_commitInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-secondary);width:100%;color:var(--dsw-alias-label-primary);resize:vertical;background:0 0;border-radius:6px;padding:6px 8px;font-family:inherit;font-size:12.5px}.review-module_commitCheck{color:var(--dsw-alias-label-secondary);align-items:center;gap:6px;font-size:12px;display:inline-flex}.review-module_commitActions{flex-wrap:wrap;gap:6px;display:flex}.review-module_commitBtn{border:1px solid var(--dsw-alias-border-secondary);color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border-radius:6px;padding:4px 10px;font-size:12px}.review-module_commitBtn:hover:not(:disabled){background:var(--dsw-alias-fill-hover)}.review-module_commitBtn:disabled{cursor:not-allowed;opacity:.5}.review-module_commitBtnArmed{border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);color:var(--dsw-alias-state-business-primary)}.review-module_commitNote{max-height:140px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-word;font-size:11.5px;overflow:auto}.review-module_cellNo{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;text-align:right;user-select:none;padding:0 6px}.review-module_cellNo:first-child{border-right:1px solid var(--dsw-alias-border-secondary)}.review-module_cellText{white-space:pre-wrap;word-break:break-word;min-width:0;padding:0 8px}.review-module_cellText:nth-child(4){border-left:1px solid var(--dsw-alias-border-secondary)}.review-module_fileRowGrid{grid-template-columns:44px minmax(0,1fr);min-width:0;display:grid}.review-module_fileRowGridBlame{grid-template-columns:minmax(64px,120px) 44px minmax(0,1fr)}.review-module_blameGutter{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);user-select:none;padding:0 6px 0 8px;font-size:10.5px;line-height:1.6;overflow:hidden}.review-module_treeDivider{cursor:col-resize;border-left:1px solid var(--dsw-alias-border-secondary);background:0 0;flex:none;align-self:stretch;width:4px;margin:0 -1px}.review-module_treeDivider:hover{background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 30%, transparent);border-left-color:#0000}.review-module_historyPop{z-index:80;border:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-bg-layer-1);width:340px;max-width:calc(100vw - 48px);max-height:min(50vh,380px);box-shadow:0 8px 24px color-mix(in srgb, var(--dsw-alias-label-primary) 14%, transparent);border-radius:8px;flex-direction:column;display:flex;position:fixed}.review-module_historyScroll{flex:1;min-height:0;padding:4px;overflow:auto}.review-module_rowU{grid-template-columns:52px minmax(0,1fr);min-width:0;display:grid;position:relative}.review-module_cellNoU{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;text-align:right;user-select:none;border-right:1px solid var(--dsw-alias-border-secondary);padding:0 4px 0 6px}.review-module_cellNoUSign{letter-spacing:0;font-variant-numeric:tabular-nums}.review-module_rowUDel>.review-module_cellNoU{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent);box-shadow:inset -3px 0 0 0 var(--dsw-alias-state-error-primary)}.review-module_rowUDel .review-module_cellText{color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 88%, var(--dsw-alias-label-primary));background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent)}.review-module_rowUAdd>.review-module_cellNoU{color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent);box-shadow:inset -3px 0 0 0 var(--dsw-alias-state-success-primary)}.review-module_rowUAdd .review-module_cellText{color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 82%, var(--dsw-alias-label-primary));background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent)}.review-module_rowUCtx .review-module_cellNoU{border-right:1px solid var(--dsw-alias-border-secondary)}.review-module_fileNo{color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;text-align:right;user-select:none;border-right:1px solid var(--dsw-alias-border-secondary);padding:0 6px}.review-module_cellHatched{background-image:repeating-linear-gradient(135deg, transparent 0 4px, color-mix(in srgb, var(--dsw-alias-border-l2) 55%, transparent) 4px 5px)}.review-module_noNewline{color:var(--dsw-alias-label-tertiary);user-select:none;margin-left:6px;font-size:10px;font-style:normal}.review-module_rowDel>.review-module_cellNo:first-child,.review-module_rowPair>.review-module_cellNo:first-child{color:var(--dsw-alias-state-error-primary);background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent);box-shadow:inset -3px 0 0 0 var(--dsw-alias-state-error-primary)}.review-module_rowDel>.review-module_cellText:nth-child(2),.review-module_rowPair>.review-module_cellText:nth-child(2){color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 88%, var(--dsw-alias-label-primary));background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 14%, transparent)}.review-module_rowAdd>.review-module_cellNo:nth-child(3),.review-module_rowPair>.review-module_cellNo:nth-child(3){color:var(--dsw-alias-state-success-primary);background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent);box-shadow:inset -3px 0 0 0 var(--dsw-alias-state-success-primary)}.review-module_rowAdd>.review-module_cellText:nth-child(4),.review-module_rowPair>.review-module_cellText:nth-child(4){color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 82%, var(--dsw-alias-label-primary));background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 14%, transparent)}.review-module_wordDel{background:color-mix(in srgb, var(--dsw-alias-state-error-primary) 30%, transparent);color:color-mix(in srgb, var(--dsw-alias-state-error-primary) 75%, var(--dsw-alias-label-primary));border-radius:2px}.review-module_wordAdd{background:color-mix(in srgb, var(--dsw-alias-state-success-primary) 30%, transparent);color:color-mix(in srgb, var(--dsw-alias-state-success-primary) 68%, var(--dsw-alias-label-primary));border-radius:2px}.review-module_tokKw{color:var(--dsw-alias-brand-primary,var(--dsw-alias-state-business-primary))}.review-module_tokStr{color:var(--dsw-alias-state-success-primary)}.review-module_tokNum{color:var(--dsw-alias-state-warning-primary,var(--dsw-alias-state-business-primary))}.review-module_tokCom{color:var(--dsw-alias-label-tertiary);font-style:italic}.review-module_diffBottomReserve{height:var(--dsh-review-bottom-clearance,140px)}.review-module_previewScroll{min-height:0;padding:12px 16px var(--dsh-review-bottom-clearance,140px);scroll-padding-bottom:var(--dsh-review-bottom-clearance,140px);flex:1;overflow:auto}.review-module_previewMd{max-width:none}.review-module_previewImg{border:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-bg-layer-2);border-radius:8px;max-width:100%;height:auto;display:block}.review-module_previewPdf{border:1px solid var(--dsw-alias-border-secondary);background:#fff;border-radius:8px;width:100%;height:100%;min-height:480px}.review-module_zoomGroup{border:1px solid var(--dsw-alias-border-secondary);background:color-mix(in srgb, var(--dsw-alias-fill-hover) 60%, transparent);border-radius:6px;flex:none;align-items:center;gap:2px;display:inline-flex;overflow:hidden}.review-module_zoomBtn{width:24px;height:22px;color:var(--dsw-alias-label-secondary);cursor:pointer;background:0 0;border:none;flex:none;justify-content:center;align-items:center;padding:0;font-size:12px;display:inline-flex}.review-module_zoomBtn:hover{background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary)}.review-module_zoomInput{width:52px;color:var(--dsw-alias-label-primary);text-align:center;font-variant-numeric:tabular-nums;background:0 0;border:none;outline:none;padding:0 2px;font-size:11.5px}.review-module_paneNotice{color:var(--dsw-alias-label-secondary);padding:16px;font-family:inherit;font-size:12.5px}.review-module_graphList{border-right:1px solid var(--dsw-alias-border-secondary);width:46%;min-width:340px;min-height:0;padding-bottom:var(--dsh-review-bottom-clearance,140px);scroll-padding-bottom:var(--dsh-review-bottom-clearance,140px);flex-direction:column;flex:none;display:flex;overflow:auto}.review-module_graphListNarrow{width:260px;min-width:260px}.review-module_graphToggleRow{border-bottom:1px solid var(--dsw-alias-border-secondary);flex:none;justify-content:flex-end;align-items:center;height:24px;padding:0 6px 0 8px;display:flex}.review-module_graphListNarrow .review-module_graphToggleRow{justify-content:flex-end;padding-right:6px}.review-module_railList{padding-top:2px}.review-module_railRow{grid-template-columns:var(--graph-w) minmax(0, 1fr) 84px;width:100%;height:27px;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:0 0;border:none;align-items:center;gap:7px;padding:0 8px;font-size:12px;display:grid;position:relative}.review-module_railRow:hover{background:var(--dsw-alias-fill-hover)}.review-module_railSubject{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:inherit;font-size:12px;font:inherit;text-align:left;cursor:pointer;background:0 0;border:none;padding:0;overflow:hidden}.review-module_railHash{color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code,ui-monospace, monospace);font-variant-numeric:tabular-nums;text-align:right;font-size:11px}.review-module_railTip{z-index:80;border:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-bg-layer-1);width:320px;box-shadow:0 8px 24px color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent);pointer-events:none;border-radius:8px;flex-direction:column;gap:3px;padding:8px 10px;display:flex;position:fixed}.review-module_railTipSubject{color:var(--dsw-alias-label-primary);word-break:break-word;font-size:12.5px;font-weight:600}.review-module_railTipHash{color:var(--dsw-alias-label-tertiary);font-family:var(--ds-font-family-code,ui-monospace, monospace);font-variant-numeric:tabular-nums;word-break:break-all;font-size:11.5px}.review-module_railTipMeta{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;word-break:break-all;font-size:11.5px}.review-module_railTipRefs{color:var(--dsw-alias-state-business-primary);word-break:break-word;font-size:11px}.review-module_graphToggle{border:1px solid var(--dsw-alias-border-secondary);width:20px;height:18px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border-radius:4px;justify-content:center;align-items:center;padding:0;font-size:10px;display:inline-flex}.review-module_graphToggle:hover{background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary)}.review-module_commitList{--graph-w:48px;padding:0}.review-module_commitHeader{z-index:1;border-bottom:1px solid var(--dsw-alias-border-secondary);background:var(--dsw-alias-bg-layer-1);height:28px;color:var(--dsw-alias-label-tertiary);align-items:center;gap:7px;padding:0 10px 0 8px;font-size:11.5px;display:grid;position:sticky;top:0}body[data-dsh-bg-glass] .review-module_commitHeader{background:0 0}.review-module_commitRow{width:100%;height:27px;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;background:0 0;border:none;align-items:center;gap:7px;padding:0 10px 0 8px;font-size:12.5px;display:grid}.review-module_commitRow:hover{background:var(--dsw-alias-fill-hover)}.review-module_commitRowActive{background:var(--dsw-alias-fill-active)}.review-module_graphCell{flex:none;display:block}.review-module_commitMain{align-items:center;gap:5px;min-width:0;display:inline-flex}.review-module_commitSubject{text-overflow:ellipsis;white-space:nowrap;flex:0 auto;min-width:0;overflow:hidden}.review-module_commitAuthor,.review-module_commitDate,.review-module_commitHash{text-overflow:ellipsis;white-space:nowrap;min-width:0;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;font-size:11px;display:block;overflow:hidden}.review-module_commitHash{font-family:var(--ds-font-family-code,ui-monospace, monospace)}.review-module_refBadgeHead,.review-module_refBadgeTag,.review-module_refBadgeOther,.review-module_refBadgeHeadState{text-overflow:ellipsis;white-space:nowrap;border-radius:999px;flex:none;max-width:140px;padding:1px 6px;font-size:10.5px;line-height:1.4;overflow:hidden}.review-module_refBadgeHead{border:1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, transparent);color:var(--dsw-alias-state-business-primary)}.review-module_refBadgeHeadState{border:1px solid var(--dsw-alias-state-warning-primary,var(--dsw-alias-state-business-primary));background:color-mix(in srgb, var(--dsw-alias-state-business-primary) 12%, transparent);color:var(--dsw-alias-state-business-primary);font-weight:600}.review-module_refBadgeTag{border:1px solid color-mix(in srgb, var(--dsw-alias-state-success-primary) 45%, transparent);color:var(--dsw-alias-state-success-primary)}.review-module_refBadgeOther{border:1px solid var(--dsw-alias-border-secondary);color:var(--dsw-alias-label-tertiary)}.review-module_commitDetail{flex-direction:column;flex:1;min-width:0;min-height:0;display:flex}.review-module_commitInfo{border-bottom:1px solid var(--dsw-alias-border-secondary);flex-direction:column;flex:none;gap:6px;padding:9px 12px;display:flex}.review-module_commitInfoTop{align-items:baseline;gap:8px;display:flex}.review-module_infoToggle{width:20px;height:20px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:none;border-radius:4px;flex:none;justify-content:center;align-self:center;align-items:center;padding:0;display:inline-flex}.review-module_infoToggle:hover{background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary)}.review-module_infoToggleIcon{transition:transform .12s;display:inline-flex}.review-module_infoToggleOpen{transform:rotate(90deg)}.review-module_commitStats{font-variant-numeric:tabular-nums;white-space:nowrap;flex:none;align-items:baseline;gap:6px;margin-left:auto;font-size:12px;display:inline-flex}.review-module_commitInfoLabel{min-width:44px;color:var(--dsw-alias-label-tertiary);flex:none;font-size:11.5px}.review-module_commitInfoSubjectArea{flex-wrap:wrap;align-items:center;gap:5px;min-width:0;display:inline-flex}.review-module_commitInfoSubject{color:var(--dsw-alias-label-primary);word-break:break-word;font-size:13px;font-weight:600}.review-module_commitBody{max-height:120px;color:var(--dsw-alias-label-secondary);white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.6;overflow:auto}.review-module_commitInfoGrid{color:var(--dsw-alias-label-secondary);grid-template-columns:minmax(44px,auto) minmax(0,1fr) minmax(44px,auto) minmax(0,1fr);align-items:baseline;gap:4px 10px;font-size:12px;display:grid}.review-module_commitHashBtn{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-family:var(--ds-font-family-code,ui-monospace, monospace);text-align:left;cursor:pointer;background:0 0;border:none;border-radius:4px;padding:0;font-size:11.5px;overflow:hidden}.review-module_commitHashBtn:hover{background:var(--dsw-alias-fill-hover);color:var(--dsw-alias-label-primary)}.review-module_commitSplit{flex-direction:row;flex:1;min-height:0;display:flex}.review-module_commitTreePanel{border-right:1px solid var(--dsw-alias-border-secondary);flex-direction:column;flex:none;width:260px;min-height:0;display:flex}.review-module_commitTreePanel .review-module_treePanel{border-left:none;width:100%}.review-module_commitDiffArea{flex-direction:column;flex:1;min-width:0;min-height:0;display:flex}.review-module_errorText{color:var(--dsw-alias-state-error-primary)}.review-module_emptyState{flex-direction:column;flex:1;justify-content:center;align-items:center;gap:6px;display:flex}.review-module_emptyTitle{color:var(--dsw-alias-label-secondary);font-size:13.5px;font-weight:600}.review-module_emptyHint{color:var(--dsw-alias-label-tertiary);font-size:12px}.review-module_pluginCard{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);border-radius:16px;width:100%;list-style:none;transition:border-color .16s,background .16s}.review-module_pluginCard:hover{border-color:var(--dsw-alias-label-dimmed)}.review-module_pluginCardOpen{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-label-dimmed)}.review-module_pluginCardHead{width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:0 0;border:0;border-radius:12px;align-items:center;gap:12px;padding:14px 16px;display:flex}.review-module_pluginCardHead:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}.review-module_pluginCardHeadText{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}.review-module_pluginCardName{color:var(--dsw-alias-label-primary);font-size:15px;font-weight:600;line-height:1.4}.review-module_pluginCardDescription{color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.review-module_pluginCardBody{border-top:.5px solid var(--dsw-alias-border-l2);margin:0 16px;padding:2px 0 10px}.review-module_pluginPrefRow{justify-content:space-between;align-items:center;gap:16px;padding:12px 0;display:flex}.review-module_pluginPrefRow+.review-module_pluginPrefRow{border-top:.5px solid var(--dsw-alias-border-l2)}.review-module_pluginPrefGroup{flex:none;align-items:center;gap:6px;display:inline-flex}.review-module_pluginPrefBtn{border:.5px solid var(--dsw-alias-border-l4);background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary);cursor:pointer;white-space:nowrap;border-radius:8px;flex:none;align-items:center;padding:4px 12px;font-size:12.5px;line-height:1.5;transition:border-color .16s,background .16s,color .16s;display:inline-flex}.review-module_pluginPrefBtn:hover:not(:disabled){border-color:var(--dsw-alias-label-dimmed);color:var(--dsw-alias-label-primary)}.review-module_pluginPrefBtnActive{border-color:var(--dsw-alias-brand-primary);background:color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent);color:var(--dsw-alias-label-primary);font-weight:500}.review-module_pluginPrefText{flex-direction:column;gap:2px;min-width:0;display:flex}.review-module_pluginPrefLabel{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:1.5}.review-module_pluginPrefHint{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.5}.review-module_pluginCardNote{color:var(--dsw-alias-label-tertiary);margin:8px 0 0;font-size:12px;line-height:1.5}.review-module_guideBubble{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);border-radius:10px;flex-direction:column;gap:8px;margin:8px 12px 0;padding:10px 12px;display:flex;box-shadow:0 2px 12px #00000014}.review-module_guideTitle{color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:1.4}.review-module_guideList{color:var(--dsw-alias-label-secondary);margin:0;padding-left:18px;font-size:12.5px;line-height:1.6}";
		const tagId = "dsh-git-review/review.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-git-review";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var review_module_css_default = {
			"abCount": "review-module_abCount",
			"badge": "review-module_badge",
			"badgeBusiness": "review-module_badgeBusiness",
			"badgeError": "review-module_badgeError",
			"badgeMuted": "review-module_badgeMuted",
			"badgeSuccess": "review-module_badgeSuccess",
			"blameGutter": "review-module_blameGutter",
			"body": "review-module_body",
			"branchBtn": "review-module_branchBtn",
			"branchCreateRow": "review-module_branchCreateRow",
			"branchCurrentMark": "review-module_branchCurrentMark",
			"branchDanger": "review-module_branchDanger",
			"branchFetchRow": "review-module_branchFetchRow",
			"branchGroupLabel": "review-module_branchGroupLabel",
			"branchIconBtn": "review-module_branchIconBtn",
			"branchListScroll": "review-module_branchListScroll",
			"branchNameBtn": "review-module_branchNameBtn",
			"branchNameInput": "review-module_branchNameInput",
			"branchPop": "review-module_branchPop",
			"branchRemoteDetails": "review-module_branchRemoteDetails",
			"branchRow": "review-module_branchRow",
			"branchRowCurrent": "review-module_branchRowCurrent",
			"branchRowRemote": "review-module_branchRowRemote",
			"cellHatched": "review-module_cellHatched",
			"cellNo": "review-module_cellNo",
			"cellNoU": "review-module_cellNoU",
			"cellNoUSign": "review-module_cellNoUSign",
			"cellText": "review-module_cellText",
			"centered": "review-module_centered",
			"chip": "review-module_chip",
			"commentActions": "review-module_commentActions",
			"commentEditor": "review-module_commentEditor",
			"commentLine": "review-module_commentLine",
			"commentTextarea": "review-module_commentTextarea",
			"commitActions": "review-module_commitActions",
			"commitAuthor": "review-module_commitAuthor",
			"commitBody": "review-module_commitBody",
			"commitBtn": "review-module_commitBtn",
			"commitBtnArmed": "review-module_commitBtnArmed",
			"commitCheck": "review-module_commitCheck",
			"commitDate": "review-module_commitDate",
			"commitDetail": "review-module_commitDetail",
			"commitDiffArea": "review-module_commitDiffArea",
			"commitHash": "review-module_commitHash",
			"commitHashBtn": "review-module_commitHashBtn",
			"commitHeader": "review-module_commitHeader",
			"commitInfo": "review-module_commitInfo",
			"commitInfoGrid": "review-module_commitInfoGrid",
			"commitInfoLabel": "review-module_commitInfoLabel",
			"commitInfoSubject": "review-module_commitInfoSubject",
			"commitInfoSubjectArea": "review-module_commitInfoSubjectArea",
			"commitInfoTop": "review-module_commitInfoTop",
			"commitInput": "review-module_commitInput",
			"commitList": "review-module_commitList",
			"commitMain": "review-module_commitMain",
			"commitNote": "review-module_commitNote",
			"commitPop": "review-module_commitPop",
			"commitRow": "review-module_commitRow",
			"commitRowActive": "review-module_commitRowActive",
			"commitSplit": "review-module_commitSplit",
			"commitStats": "review-module_commitStats",
			"commitSubject": "review-module_commitSubject",
			"commitToggle": "review-module_commitToggle",
			"commitTreePanel": "review-module_commitTreePanel",
			"compareArrow": "review-module_compareArrow",
			"compareCluster": "review-module_compareCluster",
			"compareFixed": "review-module_compareFixed",
			"compareRow": "review-module_compareRow",
			"conflictBar": "review-module_conflictBar",
			"conflictText": "review-module_conflictText",
			"diffBottomReserve": "review-module_diffBottomReserve",
			"diffHeader": "review-module_diffHeader",
			"diffHeaderSpacer": "review-module_diffHeaderSpacer",
			"diffPane": "review-module_diffPane",
			"diffPath": "review-module_diffPath",
			"diffRename": "review-module_diffRename",
			"diffScroll": "review-module_diffScroll",
			"dirCount": "review-module_dirCount",
			"dirName": "review-module_dirName",
			"dirRow": "review-module_dirRow",
			"draftClear": "review-module_draftClear",
			"draftEmpty": "review-module_draftEmpty",
			"draftHead": "review-module_draftHead",
			"draftList": "review-module_draftList",
			"draftPop": "review-module_draftPop",
			"draftRow": "review-module_draftRow",
			"draftRowBody": "review-module_draftRowBody",
			"draftRowPath": "review-module_draftRowPath",
			"draftRowText": "review-module_draftRowText",
			"emptyHint": "review-module_emptyHint",
			"emptyState": "review-module_emptyState",
			"emptyTitle": "review-module_emptyTitle",
			"errorText": "review-module_errorText",
			"fileCount": "review-module_fileCount",
			"fileMenuActions": "review-module_fileMenuActions",
			"fileMenuApps": "review-module_fileMenuApps",
			"fileMenuDanger": "review-module_fileMenuDanger",
			"fileMenuDeletePath": "review-module_fileMenuDeletePath",
			"fileMenuDivider": "review-module_fileMenuDivider",
			"fileMenuItem": "review-module_fileMenuItem",
			"fileMenuItemIcon": "review-module_fileMenuItemIcon",
			"fileMenuPop": "review-module_fileMenuPop",
			"fileMenuRenamePath": "review-module_fileMenuRenamePath",
			"fileMenuTitle": "review-module_fileMenuTitle",
			"fileName": "review-module_fileName",
			"fileNo": "review-module_fileNo",
			"fileRow": "review-module_fileRow",
			"fileRowActive": "review-module_fileRowActive",
			"fileRowGrid": "review-module_fileRowGrid",
			"fileRowGridBlame": "review-module_fileRowGridBlame",
			"filterInput": "review-module_filterInput",
			"filterRow": "review-module_filterRow",
			"gapBar": "review-module_gapBar",
			"graphCell": "review-module_graphCell",
			"graphList": "review-module_graphList",
			"graphListNarrow": "review-module_graphListNarrow",
			"graphToggle": "review-module_graphToggle",
			"graphToggleRow": "review-module_graphToggleRow",
			"guideBubble": "review-module_guideBubble",
			"guideList": "review-module_guideList",
			"guideTitle": "review-module_guideTitle",
			"historyPop": "review-module_historyPop",
			"historyScroll": "review-module_historyScroll",
			"hunkActions": "review-module_hunkActions",
			"hunkHeader": "review-module_hunkHeader",
			"hunkHeaderText": "review-module_hunkHeaderText",
			"hunkOpArmed": "review-module_hunkOpArmed",
			"hunkOpBtn": "review-module_hunkOpBtn",
			"hunkOpDanger": "review-module_hunkOpDanger",
			"iconBtn": "review-module_iconBtn",
			"iconBtnBadge": "review-module_iconBtnBadge",
			"iconBtnSpinning": "review-module_iconBtnSpinning",
			"infoToggle": "review-module_infoToggle",
			"infoToggleIcon": "review-module_infoToggleIcon",
			"infoToggleOpen": "review-module_infoToggleOpen",
			"mainPane": "review-module_mainPane",
			"matchChip": "review-module_matchChip",
			"matchCount": "review-module_matchCount",
			"matchMark": "review-module_matchMark",
			"matchNav": "review-module_matchNav",
			"noNewline": "review-module_noNewline",
			"noticeError": "review-module_noticeError",
			"noticeRow": "review-module_noticeRow",
			"paneNotice": "review-module_paneNotice",
			"pickerBtn": "review-module_pickerBtn",
			"pickerBtnOpen": "review-module_pickerBtnOpen",
			"pickerBtnText": "review-module_pickerBtnText",
			"pickerEmpty": "review-module_pickerEmpty",
			"pickerGroupLabel": "review-module_pickerGroupLabel",
			"pickerItem": "review-module_pickerItem",
			"pickerItemActive": "review-module_pickerItemActive",
			"pickerItemCheck": "review-module_pickerItemCheck",
			"pickerItemDisabled": "review-module_pickerItemDisabled",
			"pickerItemIcon": "review-module_pickerItemIcon",
			"pickerItemMeta": "review-module_pickerItemMeta",
			"pickerItemName": "review-module_pickerItemName",
			"pickerPop": "review-module_pickerPop",
			"pickerScroll": "review-module_pickerScroll",
			"pickerSearch": "review-module_pickerSearch",
			"pickerSearchWrap": "review-module_pickerSearchWrap",
			"pickerWrap": "review-module_pickerWrap",
			"pluginCard": "review-module_pluginCard",
			"pluginCardBody": "review-module_pluginCardBody",
			"pluginCardDescription": "review-module_pluginCardDescription",
			"pluginCardHead": "review-module_pluginCardHead",
			"pluginCardHeadText": "review-module_pluginCardHeadText",
			"pluginCardName": "review-module_pluginCardName",
			"pluginCardNote": "review-module_pluginCardNote",
			"pluginCardOpen": "review-module_pluginCardOpen",
			"pluginPrefBtn": "review-module_pluginPrefBtn",
			"pluginPrefBtnActive": "review-module_pluginPrefBtnActive",
			"pluginPrefGroup": "review-module_pluginPrefGroup",
			"pluginPrefHint": "review-module_pluginPrefHint",
			"pluginPrefLabel": "review-module_pluginPrefLabel",
			"pluginPrefRow": "review-module_pluginPrefRow",
			"pluginPrefText": "review-module_pluginPrefText",
			"previewImg": "review-module_previewImg",
			"previewMd": "review-module_previewMd",
			"previewPdf": "review-module_previewPdf",
			"previewScroll": "review-module_previewScroll",
			"railHash": "review-module_railHash",
			"railList": "review-module_railList",
			"railRow": "review-module_railRow",
			"railSubject": "review-module_railSubject",
			"railTip": "review-module_railTip",
			"railTipHash": "review-module_railTipHash",
			"railTipMeta": "review-module_railTipMeta",
			"railTipRefs": "review-module_railTipRefs",
			"railTipSubject": "review-module_railTipSubject",
			"rangeChip": "review-module_rangeChip",
			"refBadgeHead": "review-module_refBadgeHead",
			"refBadgeHeadState": "review-module_refBadgeHeadState",
			"refBadgeOther": "review-module_refBadgeOther",
			"refBadgeTag": "review-module_refBadgeTag",
			"review-spin": "review-module_review-spin",
			"root": "review-module_root",
			"row": "review-module_row",
			"rowAdd": "review-module_rowAdd",
			"rowCommentBtn": "review-module_rowCommentBtn",
			"rowDel": "review-module_rowDel",
			"rowMatchActive": "review-module_rowMatchActive",
			"rowPair": "review-module_rowPair",
			"rowU": "review-module_rowU",
			"rowUAdd": "review-module_rowUAdd",
			"rowUCtx": "review-module_rowUCtx",
			"rowUDel": "review-module_rowUDel",
			"scopeBtn": "review-module_scopeBtn",
			"scopeBtnActive": "review-module_scopeBtnActive",
			"scopeSwitch": "review-module_scopeSwitch",
			"searchBox": "review-module_searchBox",
			"searchFlag": "review-module_searchFlag",
			"searchInput": "review-module_searchInput",
			"searchMeta": "review-module_searchMeta",
			"searchOptionsGroup": "review-module_searchOptionsGroup",
			"searchOptionsPop": "review-module_searchOptionsPop",
			"searchScope": "review-module_searchScope",
			"searchScopeBtn": "review-module_searchScopeBtn",
			"searchWrap": "review-module_searchWrap",
			"stashList": "review-module_stashList",
			"stashRow": "review-module_stashRow",
			"stashRowText": "review-module_stashRowText",
			"stashSection": "review-module_stashSection",
			"stashToggle": "review-module_stashToggle",
			"swapBtn": "review-module_swapBtn",
			"tbDivider": "review-module_tbDivider",
			"tokCom": "review-module_tokCom",
			"tokKw": "review-module_tokKw",
			"tokNum": "review-module_tokNum",
			"tokStr": "review-module_tokStr",
			"toolBtn": "review-module_toolBtn",
			"toolBtnActive": "review-module_toolBtnActive",
			"toolbar": "review-module_toolbar",
			"toolbarRow": "review-module_toolbarRow",
			"totalAdded": "review-module_totalAdded",
			"totalDeleted": "review-module_totalDeleted",
			"totals": "review-module_totals",
			"treeDivider": "review-module_treeDivider",
			"treeEmpty": "review-module_treeEmpty",
			"treeModeRow": "review-module_treeModeRow",
			"treePanel": "review-module_treePanel",
			"treePending": "review-module_treePending",
			"treeScroll": "review-module_treeScroll",
			"viewedDot": "review-module_viewedDot",
			"viewedDotDone": "review-module_viewedDotDone",
			"wordAdd": "review-module_wordAdd",
			"wordDel": "review-module_wordDel",
			"zoomBtn": "review-module_zoomBtn",
			"zoomGroup": "review-module_zoomGroup",
			"zoomInput": "review-module_zoomInput"
		};
		//#endregion
		//#region src/client/file-menu.tsx
		function ChatItem({ path, useInput, inputActions, onRun, t }) {
			const draft = useInput((s) => s.draft);
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: review_module_css_default.fileMenuItem,
				onClick: () => {
					onRun("chat", () => {
						const current = draft.replace(/\s+$/, "");
						inputActions.setDraft(current === "" ? path : current + "\n" + path);
						return Promise.resolve(null);
					});
				},
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: review_module_css_default.fileMenuItemIcon,
					children: (0, react_jsx_runtime.jsx)(CheckIcon, {})
				}), (0, react_jsx_runtime.jsx)("span", {
					className: review_module_css_default.pickerItemName,
					children: t("menu.addToChat")
				})]
			});
		}
		function FileMenu({ state, apps, writable, refsMode, useInput, inputActions, onClose, openApp, copyPath, copyName, rename, remove, gitAction, conflictResolve, t }) {
			const [mode, setMode] = (0, react.useState)("menu");
			const [renameValue, setRenameValue] = (0, react.useState)(state.path);
			const [note, setNote] = (0, react.useState)(null);
			const rootRef = (0, react.useRef)(null);
			const canChat = useInput !== void 0 && inputActions !== void 0;
			(0, react.useEffect)(() => {
				const onKey = (event) => {
					if (event.key === "Escape") onClose();
				};
				document.addEventListener("keydown", onKey);
				if (mode === "busy") return () => {
					document.removeEventListener("keydown", onKey);
				};
				const onDown = (event) => {
					if (rootRef.current !== null && !rootRef.current.contains(event.target)) onClose();
				};
				document.addEventListener("mousedown", onDown);
				return () => {
					document.removeEventListener("mousedown", onDown);
					document.removeEventListener("keydown", onKey);
				};
			}, [mode, onClose]);
			const [pos, setPos] = (0, react.useState)({
				left: state.x,
				top: state.y
			});
			(0, react.useLayoutEffect)(() => {
				const el = rootRef.current;
				if (el === null) return;
				const rect = el.getBoundingClientRect();
				const margin = 8;
				let { left, top } = pos;
				if (pos.left + rect.width > window.innerWidth - margin) left = window.innerWidth - rect.width - margin;
				if (pos.top + rect.height > window.innerHeight - margin) top = window.innerHeight - rect.height - margin;
				left = Math.max(margin, left);
				top = Math.max(margin, top);
				if (left !== pos.left || top !== pos.top) setPos({
					left,
					top
				});
			});
			const run = async (_label, fn) => {
				setMode("busy");
				setNote(null);
				const error = await fn();
				if (error === null) {
					onClose();
					return;
				}
				setNote(error);
				setMode("menu");
			};
			const appLabel = (id) => {
				switch (id) {
					case "default": return t("menu.app.default");
					case "explorer": return t("menu.app.explorer");
					case "notepad": return t("menu.app.notepad");
					case "code": return t("menu.app.code");
					case "code-insiders": return t("menu.app.codeInsiders");
					default: return id;
				}
			};
			if (mode === "rename") {
				const name = state.path.split("/").pop() ?? state.path;
				const dir = state.path.slice(0, state.path.length - name.length);
				return (0, react_jsx_runtime.jsxs)("div", {
					className: review_module_css_default.fileMenuPop,
					ref: rootRef,
					style: {
						left: pos.left,
						top: pos.top,
						width: 330
					},
					children: [
						(0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.fileMenuTitle,
							children: t("menu.rename")
						}),
						(0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.fileMenuRenamePath,
							children: dir
						}),
						(0, react_jsx_runtime.jsx)("input", {
							className: review_module_css_default.branchNameInput,
							value: renameValue,
							onChange: (event) => {
								setRenameValue(event.target.value);
							},
							onKeyDown: (event) => {
								if (event.key === "Enter" && renameValue.trim() !== "" && renameValue.trim() !== state.path) run("rename", () => rename(state.path, renameValue.trim()));
								if (event.key === "Escape") setMode("menu");
							},
							autoFocus: true,
							spellCheck: false
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: review_module_css_default.fileMenuActions,
							children: [(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.commitBtn,
								disabled: renameValue.trim() === "" || renameValue.trim() === state.path,
								onClick: () => {
									run("rename", () => rename(state.path, renameValue.trim()));
								},
								children: t("menu.confirmRename")
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.commitBtn,
								onClick: () => {
									setMode("menu");
									setNote(null);
								},
								children: t("menu.cancel")
							})]
						}),
						note !== null && (0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.commitNote + " " + review_module_css_default.errorText,
							children: note
						})
					]
				});
			}
			if (mode === "delete") return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.fileMenuPop,
				ref: rootRef,
				style: {
					left: pos.left,
					top: pos.top,
					width: 330
				},
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.fileMenuTitle,
						children: t("menu.confirmDeleteTitle")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.fileMenuDeletePath,
						children: state.path
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.fileMenuActions,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: review_module_css_default.commitBtn + " " + review_module_css_default.branchDanger,
							onClick: () => {
								run("delete", () => remove(state.path));
							},
							children: t("menu.confirmDelete")
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: review_module_css_default.commitBtn,
							onClick: () => {
								setMode("menu");
								setNote(null);
							},
							children: t("menu.cancel")
						})]
					}),
					note !== null && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.commitNote + " " + review_module_css_default.errorText,
						children: note
					})
				]
			});
			if (mode === "discard") return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.fileMenuPop,
				ref: rootRef,
				style: {
					left: pos.left,
					top: pos.top,
					width: 330
				},
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.fileMenuTitle,
						children: t("menu.confirmDiscardTitle")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.fileMenuDeletePath,
						children: state.path
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.fileMenuActions,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: review_module_css_default.commitBtn + " " + review_module_css_default.branchDanger,
							onClick: () => {
								run("discard", () => gitAction?.("discard", state.path) ?? Promise.resolve(t("menu.unavailable")));
							},
							children: t("menu.confirmDiscard")
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: review_module_css_default.commitBtn,
							onClick: () => {
								setMode("menu");
								setNote(null);
							},
							children: t("menu.cancel")
						})]
					}),
					note !== null && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.commitNote + " " + review_module_css_default.errorText,
						children: note
					})
				]
			});
			if (mode === "apps") return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.fileMenuPop,
				ref: rootRef,
				style: {
					left: pos.left,
					top: pos.top,
					width: 240
				},
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.fileMenuTitle,
						title: state.path,
						children: state.path
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.fileMenuApps,
						children: [(apps ?? []).map((app) => (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: review_module_css_default.pickerItem + (app.available ? "" : " " + review_module_css_default.pickerItemDisabled),
							disabled: !app.available,
							onClick: () => {
								run("openWith", () => openApp(state.path, app.id));
							},
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.pickerItemName,
								children: appLabel(app.id)
							}), !app.available && (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.pickerItemMeta,
								children: t("menu.appUnavailable")
							})]
						}, app.id)), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: review_module_css_default.pickerItem,
							onClick: () => {
								setMode("menu");
							},
							children: (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.pickerItemName,
								children: t("menu.back")
							})
						})]
					}),
					note !== null && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.commitNote + " " + review_module_css_default.errorText,
						children: note
					})
				]
			});
			const items = [
				{
					key: "open",
					icon: (0, react_jsx_runtime.jsx)(OpenIcon, {}),
					label: t("menu.openDefault"),
					onClick: () => {
						run("open", () => openApp(state.path, "default"));
					}
				},
				{
					key: "reveal",
					icon: (0, react_jsx_runtime.jsx)(FolderIcon, {}),
					label: t("menu.reveal"),
					onClick: () => {
						run("open", () => openApp(state.path, "explorer"));
					}
				},
				{
					key: "open-with",
					icon: (0, react_jsx_runtime.jsx)(FileIcon, {}),
					label: t("menu.openWith"),
					onClick: () => {
						setNote(null);
						setMode("apps");
					}
				}
			];
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.fileMenuPop,
				ref: rootRef,
				style: {
					left: pos.left,
					top: pos.top,
					width: 240
				},
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.fileMenuTitle,
						title: state.path,
						children: state.path
					}),
					(0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
						items.map((item) => (0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: review_module_css_default.fileMenuItem,
							onClick: item.onClick,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.fileMenuItemIcon,
								children: item.icon
							}), (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.pickerItemName,
								children: item.label
							})]
						}, item.key)),
						(0, react_jsx_runtime.jsx)("div", { className: review_module_css_default.fileMenuDivider }),
						(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: review_module_css_default.fileMenuItem,
							onClick: () => {
								run("copy", () => copyPath(state.path));
							},
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.fileMenuItemIcon,
								children: (0, react_jsx_runtime.jsx)(CopyIcon, {})
							}), (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.pickerItemName,
								children: t("menu.copyPath")
							})]
						}),
						(0, react_jsx_runtime.jsxs)("button", {
							type: "button",
							className: review_module_css_default.fileMenuItem,
							onClick: () => {
								run("copy", () => copyName(state.path));
							},
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.fileMenuItemIcon,
								children: (0, react_jsx_runtime.jsx)(CopyIcon, {})
							}), (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.pickerItemName,
								children: t("menu.copyName")
							})]
						}),
						canChat && useInput !== void 0 && inputActions !== void 0 && (0, react_jsx_runtime.jsx)(ChatItem, {
							path: state.path,
							useInput,
							inputActions,
							onRun: (label, fn) => {
								run(label, fn);
							},
							t
						}),
						writable && !refsMode && state.git?.conflicted === true && conflictResolve !== void 0 && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							(0, react_jsx_runtime.jsx)("div", { className: review_module_css_default.fileMenuDivider }),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.fileMenuItem,
								onClick: () => {
									run("ours", () => conflictResolve("ours", state.path));
								},
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.fileMenuItemIcon,
									children: (0, react_jsx_runtime.jsx)(CheckIcon, {})
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemName,
									children: t("conflict.ours")
								})]
							}),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.fileMenuItem,
								onClick: () => {
									run("theirs", () => conflictResolve("theirs", state.path));
								},
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.fileMenuItemIcon,
									children: (0, react_jsx_runtime.jsx)(CheckIcon, {})
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemName,
									children: t("conflict.theirs")
								})]
							})
						] }),
						writable && !refsMode && state.git !== void 0 && state.git.conflicted !== true && gitAction !== void 0 && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							(0, react_jsx_runtime.jsx)("div", { className: review_module_css_default.fileMenuDivider }),
							(state.git.unstaged || state.git.untracked) && (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.fileMenuItem,
								onClick: () => {
									run("stage", () => gitAction("stage", state.path));
								},
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.fileMenuItemIcon,
									children: (0, react_jsx_runtime.jsx)(PlusIcon, {})
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemName,
									children: t("menu.stage")
								})]
							}),
							state.git.staged && (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.fileMenuItem,
								onClick: () => {
									run("unstage", () => gitAction("unstage", state.path));
								},
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.fileMenuItemIcon,
									children: (0, react_jsx_runtime.jsx)(MinusIcon, {})
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemName,
									children: t("menu.unstage")
								})]
							}),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.fileMenuItem + " " + review_module_css_default.fileMenuDanger,
								onClick: () => {
									setNote(null);
									setMode("discard");
								},
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.fileMenuItemIcon,
									children: (0, react_jsx_runtime.jsx)(UndoIcon, {})
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemName,
									children: t("menu.discard")
								})]
							})
						] }),
						writable && !refsMode && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
							(0, react_jsx_runtime.jsx)("div", { className: review_module_css_default.fileMenuDivider }),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.fileMenuItem,
								onClick: () => {
									setNote(null);
									setMode("rename");
								},
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.fileMenuItemIcon,
									children: (0, react_jsx_runtime.jsx)(PencilIcon, {})
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemName,
									children: t("menu.rename")
								})]
							}),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.fileMenuItem + " " + review_module_css_default.fileMenuDanger,
								onClick: () => {
									setNote(null);
									setMode("delete");
								},
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.fileMenuItemIcon,
									children: (0, react_jsx_runtime.jsx)(TrashIcon, {})
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemName,
									children: t("menu.delete")
								})]
							})
						] })
					] }),
					note !== null && mode !== "busy" && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.commitNote + " " + review_module_css_default.errorText,
						children: note
					}),
					mode === "busy" && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.commitNote,
						children: t("menu.busy")
					})
				]
			});
		}
		//#endregion
		//#region src/client/commit-menu.tsx
		function CommitMenu({ state, running, onClose, run, t }) {
			const [mode, setMode] = (0, react.useState)("menu");
			const [note, setNote] = (0, react.useState)(null);
			const rootRef = (0, react.useRef)(null);
			const [pos, setPos] = (0, react.useState)({
				left: state.x,
				top: state.y
			});
			(0, react.useEffect)(() => {
				const onKey = (event) => {
					if (event.key === "Escape") onClose();
				};
				document.addEventListener("keydown", onKey);
				if (mode === "busy") return () => {
					document.removeEventListener("keydown", onKey);
				};
				const onDown = (event) => {
					if (rootRef.current !== null && !rootRef.current.contains(event.target)) onClose();
				};
				document.addEventListener("mousedown", onDown);
				return () => {
					document.removeEventListener("mousedown", onDown);
					document.removeEventListener("keydown", onKey);
				};
			}, [mode, onClose]);
			(0, react.useLayoutEffect)(() => {
				const el = rootRef.current;
				if (el === null) return;
				const rect = el.getBoundingClientRect();
				const margin = 8;
				let { left, top } = pos;
				if (pos.left + rect.width > window.innerWidth - margin) left = window.innerWidth - rect.width - margin;
				if (pos.top + rect.height > window.innerHeight - margin) top = window.innerHeight - rect.height - margin;
				left = Math.max(margin, left);
				top = Math.max(margin, top);
				if (left !== pos.left || top !== pos.top) setPos({
					left,
					top
				});
			});
			const exec = async (action, graphMode) => {
				setMode("busy");
				setNote(null);
				const error = await run(action, state.hash, graphMode);
				if (error === null) {
					onClose();
					return;
				}
				setNote(error);
				setMode("menu");
			};
			const itemClass = review_module_css_default.fileMenuItem;
			if (mode === "reset") return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.fileMenuPop,
				ref: rootRef,
				style: {
					left: pos.left,
					top: pos.top,
					width: 320
				},
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.fileMenuTitle,
						children: t("history.resetTitle")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.fileMenuDeletePath,
						children: state.hash.slice(0, 10) + " · " + state.subject
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.fileMenuApps,
						children: [
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.stashRowText + " " + itemClass,
								disabled: running,
								onClick: () => {
									exec("reset", "soft");
								},
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemName,
									children: t("history.resetSoft")
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemMeta,
									children: t("history.resetSoftHint")
								})]
							}),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.stashRowText + " " + itemClass,
								disabled: running,
								onClick: () => {
									exec("reset", "mixed");
								},
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemName,
									children: t("history.resetMixed")
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemMeta,
									children: t("history.resetMixedHint")
								})]
							}),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.stashRowText + " " + itemClass + " " + review_module_css_default.fileMenuDanger,
								disabled: running,
								onClick: () => {
									exec("reset", "hard");
								},
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemName,
									children: t("history.resetHard")
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pickerItemMeta,
									children: t("history.resetHardHint")
								})]
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.fileMenuActions,
						children: (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: review_module_css_default.commitBtn,
							onClick: () => {
								setMode("menu");
								setNote(null);
							},
							children: t("menu.cancel")
						})
					}),
					note !== null && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.commitNote + " " + review_module_css_default.errorText,
						children: note
					})
				]
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.fileMenuPop,
				ref: rootRef,
				style: {
					left: pos.left,
					top: pos.top,
					width: 250
				},
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.fileMenuTitle,
						title: state.hash,
						children: state.hash.slice(0, 10) + " · " + state.subject
					}),
					(0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: itemClass,
						disabled: running,
						onClick: () => {
							setNote(null);
							setMode("reset");
						},
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.fileMenuItemIcon,
							children: (0, react_jsx_runtime.jsx)(UndoIcon, {})
						}), (0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.pickerItemName,
							children: t("history.reset")
						})]
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: itemClass,
						disabled: running,
						onClick: () => {
							exec("revert");
						},
						children: (0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.pickerItemName,
							children: t("history.revert")
						})
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: itemClass,
						disabled: running,
						onClick: () => {
							exec("cherry-pick");
						},
						children: (0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.pickerItemName,
							children: t("history.cherryPick")
						})
					}),
					note !== null && mode !== "busy" && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.commitNote + " " + review_module_css_default.errorText,
						children: note
					}),
					mode === "busy" && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.commitNote,
						children: t("menu.busy")
					})
				]
			});
		}
		//#endregion
		//#region src/git-parse.ts
		const EMPTY_TREE_ID = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
		function assetUrl(cwd, path, ref) {
			const query = "cwd=" + encodeURIComponent(cwd) + "&path=" + encodeURIComponent(path) + (ref ? "&ref=" + encodeURIComponent(ref) : "");
			return location.origin + "/dsh-git-review/api/asset?" + query;
		}
		const REQUEST_TIMEOUT_MS = 1e4;
		async function fetchWithTimeout(input, init) {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
			try {
				return await fetch(input, {
					...init,
					signal: controller.signal
				});
			} finally {
				clearTimeout(timer);
			}
		}
		async function hostCall(action, body) {
			try {
				const res = await fetchWithTimeout("/dsh-git-review/api/" + encodeURIComponent(action), {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(body)
				});
				if (!res.ok) try {
					return await res.json();
				} catch {
					return null;
				}
				return await res.json();
			} catch {
				return null;
			}
		}
		//#endregion
		//#region src/client/graph-view.tsx
		const LANE_W = 12;
		const ROW_H = 27;
		function laneColor(id) {
			return "hsl(" + String(id * 67 % 360) + " 62% 52%)";
		}
		function fmtGraphDate(timestamp) {
			const date = new Date(timestamp * 1e3);
			const pad = (value) => String(value).padStart(2, "0");
			return pad(date.getMonth() + 1) + "/" + pad(date.getDate()) + " " + pad(date.getHours()) + ":" + pad(date.getMinutes());
		}
		function GraphCell({ row, width }) {
			if (row === void 0) return (0, react_jsx_runtime.jsx)("span", {
				className: review_module_css_default.graphCell,
				style: {
					width,
					height: ROW_H
				}
			});
			const mid = ROW_H / 2;
			const halfUp = mid / 2;
			const halfDown = 20.25;
			const x = (lane) => lane * LANE_W + LANE_W / 2;
			const curve = (x1, y0, x2, y1, ym) => x1 === x2 ? "M " + x1 + " " + y0 + " L " + x1 + " " + y1 : "M " + x1 + " " + y0 + " C " + x1 + " " + ym + " " + x2 + " " + ym + " " + x2 + " " + y1;
			return (0, react_jsx_runtime.jsxs)("svg", {
				className: review_module_css_default.graphCell,
				width,
				height: ROW_H,
				"aria-hidden": "true",
				children: [
					row.pass.map((line, index) => (0, react_jsx_runtime.jsx)("line", {
						"data-color": String(line.color),
						x1: x(line.lane),
						y1: 0,
						x2: x(line.lane),
						y2: ROW_H,
						stroke: laneColor(line.color),
						strokeWidth: 1.5
					}, "p" + index)),
					row.inEdges.map((edge, index) => (0, react_jsx_runtime.jsx)("path", {
						"data-color": String(edge.color),
						d: curve(x(edge.from), 0, x(edge.to), mid, halfUp),
						fill: "none",
						stroke: laneColor(edge.color),
						strokeWidth: 1.5
					}, "i" + index)),
					row.outEdges.map((edge, index) => (0, react_jsx_runtime.jsx)("path", {
						"data-color": String(edge.color),
						d: curve(x(edge.from), mid, x(edge.to), ROW_H, halfDown),
						fill: "none",
						stroke: laneColor(edge.color),
						strokeWidth: 1.5
					}, "o" + index)),
					(0, react_jsx_runtime.jsx)("circle", {
						"data-color": String(row.color),
						cx: x(row.lane),
						cy: mid,
						r: row.inEdges.length > 1 ? 4.2 : 3.5,
						fill: laneColor(row.color)
					})
				]
			});
		}
		function RefBadge({ decoration }) {
			const className = decoration.name === "HEAD" ? review_module_css_default.refBadgeHeadState : decoration.kind === "head" ? review_module_css_default.refBadgeHead : decoration.kind === "tag" ? review_module_css_default.refBadgeTag : review_module_css_default.refBadgeOther;
			return (0, react_jsx_runtime.jsx)("span", {
				className,
				children: decoration.name
			});
		}
		function WorktreeRow({ width, label, selected, onSelect }) {
			const mid = ROW_H / 2;
			const cx = LANE_W / 2;
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: review_module_css_default.commitRow + (selected ? " " + review_module_css_default.commitRowActive : ""),
				style: { gridTemplateColumns: GRAPH_COLUMNS },
				onClick: onSelect,
				children: [
					(0, react_jsx_runtime.jsxs)("svg", {
						className: review_module_css_default.graphCell,
						width,
						height: ROW_H,
						"aria-hidden": "true",
						children: [(0, react_jsx_runtime.jsx)("circle", {
							cx,
							cy: mid,
							r: 3.5,
							fill: "none",
							stroke: "var(--dsw-alias-label-tertiary)",
							strokeWidth: 1.5,
							strokeDasharray: "2 2"
						}), (0, react_jsx_runtime.jsx)("line", {
							x1: cx,
							y1: 17.5,
							x2: cx,
							y2: ROW_H,
							stroke: "var(--dsw-alias-label-tertiary)",
							strokeWidth: 1.2,
							strokeDasharray: "2 3"
						})]
					}),
					(0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.commitMain,
						children: (0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.chip,
							children: label
						})
					}),
					(0, react_jsx_runtime.jsx)("span", { className: review_module_css_default.commitDate }),
					(0, react_jsx_runtime.jsx)("span", { className: review_module_css_default.commitAuthor }),
					(0, react_jsx_runtime.jsx)("span", { className: review_module_css_default.commitHash })
				]
			});
		}
		const GRAPH_COLUMNS = "calc(var(--graph-w) + 6px) minmax(0, 1fr) 86px minmax(76px, 110px) 64px";
		function CommitGraph({ commits, lanes, selected, onSelect, collapsed = false, worktree, worktreeSelected = false, onSelectWorktree, onCommitMenu, t }) {
			const maxLanes = lanes.reduce((width, row) => Math.max(width, row !== void 0 ? row.laneCount : 1), 1);
			const graphWidth = Math.max(maxLanes * LANE_W, 24);
			const columns = GRAPH_COLUMNS;
			const [tip, setTip] = (0, react.useState)(null);
			const showTip = (node, commit) => {
				const rect = node.getBoundingClientRect();
				const top = Math.min(rect.top, window.innerHeight - 90);
				setTip({
					x: Math.min(rect.right, window.innerWidth - 330),
					y: Math.max(8, top),
					commit
				});
			};
			const listRef = (0, react.useRef)(null);
			const litLine = (color) => {
				const rootEl = listRef.current;
				if (rootEl === null) return;
				rootEl.querySelectorAll("[data-color]").forEach((el) => {
					el.style.opacity = el.dataset.color === String(color) ? "1" : "0.22";
				});
			};
			const unlitLine = () => {
				const rootEl = listRef.current;
				if (rootEl === null) return;
				rootEl.querySelectorAll("[data-color]").forEach((el) => {
					el.style.opacity = "1";
				});
			};
			if (collapsed) return (0, react_jsx_runtime.jsxs)("div", {
				ref: listRef,
				className: review_module_css_default.commitList + " " + review_module_css_default.railList,
				style: { "--graph-w": graphWidth + "px" },
				children: [
					worktree !== null && worktree !== void 0 && (0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.railRow + (worktreeSelected ? " " + review_module_css_default.commitRowActive : ""),
						style: { gridTemplateColumns: "var(--graph-w) minmax(0, 1fr) 84px" },
						children: [
							(0, react_jsx_runtime.jsxs)("svg", {
								className: review_module_css_default.graphCell,
								width: graphWidth,
								height: ROW_H,
								"aria-hidden": "true",
								children: [(0, react_jsx_runtime.jsx)("circle", {
									cx: LANE_W / 2,
									cy: ROW_H / 2,
									r: 3.5,
									fill: "none",
									stroke: "var(--dsw-alias-label-tertiary)",
									strokeWidth: 1.5,
									strokeDasharray: "2 2"
								}), (0, react_jsx_runtime.jsx)("line", {
									x1: LANE_W / 2,
									y1: 17.5,
									x2: LANE_W / 2,
									y2: ROW_H,
									stroke: "var(--dsw-alias-label-tertiary)",
									strokeWidth: 1.2,
									strokeDasharray: "2 3"
								})]
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.railSubject,
								onClick: () => {
									onSelectWorktree?.();
								},
								children: (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.chip,
									children: t("graph.worktree", { count: worktree.files })
								})
							}),
							(0, react_jsx_runtime.jsx)("span", { className: review_module_css_default.railHash })
						]
					}),
					commits.map((commit, index) => (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: review_module_css_default.railRow + (selected === commit.hash ? " " + review_module_css_default.commitRowActive : ""),
						"aria-label": commit.subject + " · " + commit.hash.slice(0, 7),
						onClick: () => {
							onSelect(commit.hash);
						},
						onContextMenu: onCommitMenu === void 0 ? void 0 : (event) => {
							event.preventDefault();
							onCommitMenu(commit.hash, commit.subject, event.clientX, event.clientY);
						},
						onMouseEnter: (event) => {
							showTip(event.currentTarget, commit);
							const row = lanes[index];
							if (row !== void 0) litLine(row.color);
						},
						onMouseLeave: () => {
							setTip(null);
							unlitLine();
						},
						onFocus: (event) => {
							showTip(event.currentTarget, commit);
							const row = lanes[index];
							if (row !== void 0) litLine(row.color);
						},
						onBlur: () => {
							setTip(null);
							unlitLine();
						},
						children: [
							(0, react_jsx_runtime.jsx)(GraphCell, {
								row: lanes[index],
								width: graphWidth
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.railSubject,
								children: commit.subject
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.railHash,
								children: fmtGraphDate(commit.timestamp)
							})
						]
					}, commit.hash)),
					tip !== null && (0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.railTip,
						role: "tooltip",
						style: {
							left: tip.x + 10,
							top: tip.y
						},
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.railTipSubject,
								children: tip.commit.subject
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.railTipHash,
								children: tip.commit.hash
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.railTipMeta,
								children: tip.commit.authorName + " · " + fmtGraphDate(tip.commit.timestamp)
							}),
							tip.commit.refs.length > 0 && (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.railTipRefs,
								children: tip.commit.refs.map((item) => item.name).join(", ")
							})
						]
					})
				]
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: listRef,
				className: review_module_css_default.commitList,
				style: { "--graph-w": graphWidth + "px" },
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.commitHeader,
						style: { gridTemplateColumns: columns },
						"aria-hidden": "true",
						children: [
							(0, react_jsx_runtime.jsx)("span", { children: t("graph.col.graph") }),
							(0, react_jsx_runtime.jsx)("span", { children: t("graph.col.subject") }),
							(0, react_jsx_runtime.jsx)("span", { children: t("graph.col.date") }),
							(0, react_jsx_runtime.jsx)("span", { children: t("graph.col.author") }),
							(0, react_jsx_runtime.jsx)("span", { children: t("graph.col.commit") })
						]
					}),
					worktree !== null && worktree !== void 0 && (0, react_jsx_runtime.jsx)(WorktreeRow, {
						width: graphWidth,
						label: t("graph.worktree", { count: worktree.files }),
						selected: worktreeSelected,
						onSelect: () => {
							onSelectWorktree?.();
						}
					}),
					commits.map((commit, index) => (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: review_module_css_default.commitRow + (selected === commit.hash ? " " + review_module_css_default.commitRowActive : ""),
						style: { gridTemplateColumns: columns },
						onClick: () => {
							onSelect(commit.hash);
						},
						onContextMenu: onCommitMenu === void 0 ? void 0 : (event) => {
							event.preventDefault();
							onCommitMenu(commit.hash, commit.subject, event.clientX, event.clientY);
						},
						onMouseEnter: () => {
							const row = lanes[index];
							if (row !== void 0) litLine(row.color);
						},
						onMouseLeave: () => {
							unlitLine();
						},
						title: commit.subject,
						children: [
							(0, react_jsx_runtime.jsx)(GraphCell, {
								row: lanes[index],
								width: graphWidth
							}),
							(0, react_jsx_runtime.jsxs)("span", {
								className: review_module_css_default.commitMain,
								children: [commit.refs.map((ref) => (0, react_jsx_runtime.jsx)(RefBadge, { decoration: ref }, ref.kind + ":" + ref.name)), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.commitSubject,
									children: commit.subject
								})]
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.commitDate,
								children: fmtGraphDate(commit.timestamp)
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.commitAuthor,
								children: commit.authorName
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.commitHash,
								children: commit.hash.slice(0, 7)
							})
						]
					}, commit.hash))
				]
			});
		}
		//#endregion
		//#region src/client/ref-picker.tsx
		function shortHash(hash) {
			return hash.length > 7 ? hash.slice(0, 7) : hash;
		}
		function valueLabel(value, refs, commits, headLabel) {
			if (value === null) return {
				icon: (0, react_jsx_runtime.jsx)(BranchIcon, {}),
				text: headLabel ?? "HEAD"
			};
			if (/^[0-9a-f]{40}$/.test(value)) {
				const commit = commits?.find((item) => item.hash === value) ?? null;
				return {
					icon: (0, react_jsx_runtime.jsx)(CommitIcon, {}),
					text: commit === null ? shortHash(value) : shortHash(value) + " · " + commit.subject
				};
			}
			return {
				icon: (refs?.find((ref) => ref.name === value))?.kind === "tag" ? (0, react_jsx_runtime.jsx)(TagIcon, {}) : (0, react_jsx_runtime.jsx)(BranchIcon, {}),
				text: value
			};
		}
		function GroupLabel({ children }) {
			return (0, react_jsx_runtime.jsx)("div", {
				className: review_module_css_default.pickerGroupLabel,
				children
			});
		}
		function PickerItem({ selected, disabled, icon, name, meta, onPick, title }) {
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				role: "option",
				"aria-selected": selected,
				className: review_module_css_default.pickerItem + (selected ? " " + review_module_css_default.pickerItemActive : ""),
				disabled: disabled === true,
				onClick: onPick,
				title,
				children: [
					(0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.pickerItemIcon,
						children: icon
					}),
					(0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.pickerItemName,
						children: name
					}),
					meta !== void 0 && (0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.pickerItemMeta,
						children: meta
					}),
					selected && (0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.pickerItemCheck,
						children: (0, react_jsx_runtime.jsx)(CheckIcon, {})
					})
				]
			});
		}
		function RefPicker({ value, headLabel, refs, commits, exclude, placeholder, onPick, onOpen, t }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [query, setQuery] = (0, react.useState)("");
			const rootRef = (0, react.useRef)(null);
			const inputRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onDown = (event) => {
					if (rootRef.current !== null && !rootRef.current.contains(event.target)) setOpen(false);
				};
				document.addEventListener("mousedown", onDown);
				return () => {
					document.removeEventListener("mousedown", onDown);
				};
			}, [open]);
			(0, react.useEffect)(() => {
				if (open) inputRef.current?.focus();
			}, [open]);
			const q = query.trim().toLowerCase();
			const branches = (0, react.useMemo)(() => (refs ?? []).filter((ref) => ref.kind === "branch" && (q === "" || ref.name.toLowerCase().includes(q))), [refs, q]);
			const remotes = (0, react.useMemo)(() => (refs ?? []).filter((ref) => ref.kind === "remote" && (q === "" || ref.name.toLowerCase().includes(q))), [refs, q]);
			const tags = (0, react.useMemo)(() => (refs ?? []).filter((ref) => ref.kind === "tag" && (q === "" || ref.name.toLowerCase().includes(q))), [refs, q]);
			const commitsMatch = (0, react.useMemo)(() => (commits ?? []).filter((commit) => q === "" || commit.subject.toLowerCase().includes(q) || commit.hash.startsWith(q) || commit.authorName.toLowerCase().includes(q)), [commits, q]);
			const showCommits = commits !== null && (q !== "" || commitsMatch.length > 0);
			const isCurrent = (name) => value === name;
			const pick = (next) => {
				setOpen(false);
				setQuery("");
				onPick(next);
			};
			const { icon, text } = valueLabel(value, refs, commits, headLabel);
			const display = value !== null ? text : headLabel !== null ? headLabel : placeholder;
			return (0, react_jsx_runtime.jsxs)("span", {
				className: review_module_css_default.pickerWrap,
				ref: rootRef,
				onKeyDown: (event) => {
					if (event.key === "Escape" && open) {
						setOpen(false);
						setQuery("");
					}
				},
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: review_module_css_default.pickerBtn + (open ? " " + review_module_css_default.pickerBtnOpen : ""),
					title: t("compare.pickHint"),
					onClick: () => {
						setOpen((current) => !current);
						if (!open) onOpen?.();
					},
					"aria-haspopup": "listbox",
					"aria-expanded": open,
					children: [
						icon,
						(0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.pickerBtnText,
							children: display
						}),
						(0, react_jsx_runtime.jsx)(PopupIcon, { open })
					]
				}), open && (0, react_jsx_runtime.jsxs)("div", {
					className: review_module_css_default.pickerPop,
					role: "listbox",
					children: [(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.pickerSearchWrap,
						children: (0, react_jsx_runtime.jsx)("input", {
							ref: inputRef,
							className: review_module_css_default.pickerSearch,
							value: query,
							onChange: (event) => {
								setQuery(event.target.value);
							},
							onKeyDown: (event) => {
								if (event.key === "Escape") {
									setOpen(false);
									setQuery("");
								}
							},
							placeholder: t("picker.search"),
							spellCheck: false
						})
					}), (0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.pickerScroll,
						children: [
							headLabel !== null && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(GroupLabel, { children: t("ref.current") }), (0, react_jsx_runtime.jsx)(PickerItem, {
								selected: value === null,
								disabled: exclude === null,
								icon: (0, react_jsx_runtime.jsx)(BranchIcon, {}),
								name: headLabel,
								meta: "HEAD",
								onPick: () => {
									pick(null);
								}
							})] }),
							branches.length > 0 && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(GroupLabel, { children: t("ref.branches") }), branches.map((ref) => (0, react_jsx_runtime.jsx)(PickerItem, {
								selected: isCurrent(ref.name),
								disabled: exclude === ref.name,
								icon: (0, react_jsx_runtime.jsx)(BranchIcon, {}),
								name: ref.name,
								onPick: () => {
									pick(ref.name);
								}
							}, "b:" + ref.name))] }),
							remotes.length > 0 && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(GroupLabel, { children: t("ref.remotes") }), remotes.map((ref) => (0, react_jsx_runtime.jsx)(PickerItem, {
								selected: isCurrent(ref.name),
								disabled: exclude === ref.name,
								icon: (0, react_jsx_runtime.jsx)(BranchIcon, {}),
								name: ref.name,
								onPick: () => {
									pick(ref.name);
								}
							}, "r:" + ref.name))] }),
							tags.length > 0 && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(GroupLabel, { children: t("ref.tags") }), tags.map((ref) => (0, react_jsx_runtime.jsx)(PickerItem, {
								selected: isCurrent(ref.name),
								disabled: exclude === ref.name,
								icon: (0, react_jsx_runtime.jsx)(TagIcon, {}),
								name: ref.name,
								onPick: () => {
									pick(ref.name);
								}
							}, "t:" + ref.name))] }),
							showCommits && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								(0, react_jsx_runtime.jsx)(GroupLabel, { children: t("ref.commits") }),
								commitsMatch.slice(0, 80).map((commit) => (0, react_jsx_runtime.jsx)(PickerItem, {
									selected: value === commit.hash,
									disabled: exclude === commit.hash,
									icon: (0, react_jsx_runtime.jsx)(CommitIcon, {}),
									name: commit.subject,
									meta: fmtGraphDate(commit.timestamp),
									title: commit.hash + " · " + commit.subject,
									onPick: () => {
										pick(commit.hash);
									}
								}, "c:" + commit.hash)),
								commitsMatch.length > 80 && (0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.pickerEmpty,
									children: t("picker.truncated", { count: 80 })
								})
							] }),
							commits === null && (0, react_jsx_runtime.jsx)("div", {
								className: review_module_css_default.pickerEmpty,
								children: t("picker.loadingCommits")
							}),
							q !== "" && branches.length === 0 && remotes.length === 0 && tags.length === 0 && commitsMatch.length === 0 && (0, react_jsx_runtime.jsx)("div", {
								className: review_module_css_default.pickerEmpty,
								children: t("picker.empty")
							})
						]
					})]
				})]
			});
		}
		//#endregion
		//#region src/client/diff-parse.ts
		const MAX_RENDER_ROWS = 2e4;
		const EMPTY_DIFF = {
			hunks: [],
			binary: false,
			oldPath: null,
			newPath: null,
			newFile: false,
			deletedFile: false,
			rename: false
		};
		const HUNK_RE = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/;
		function buildHunkPatch(raw, hunkIndex) {
			if (raw === "" || hunkIndex < 0) return null;
			const lines = raw.split("\n");
			if (lines[lines.length - 1] === "") lines.pop();
			const hunkStarts = [];
			let firstHunk = -1;
			for (let i = 0; i < lines.length; i++) if (HUNK_RE.test(lines[i])) {
				hunkStarts.push(i);
				if (firstHunk < 0) firstHunk = i;
			}
			if (hunkIndex >= hunkStarts.length) return null;
			const headEnd = firstHunk;
			const bodyStart = hunkStarts[hunkIndex];
			const bodyEnd = hunkIndex + 1 < hunkStarts.length ? hunkStarts[hunkIndex + 1] : lines.length;
			return [
				...lines.slice(0, headEnd),
				...lines.slice(bodyStart, bodyEnd),
				""
			].join("\n");
		}
		function stripPrefix(field) {
			return field.startsWith("a/") || field.startsWith("b/") ? field.slice(2) : field;
		}
		function pairRun(dels, adds, rows) {
			const paired = Math.min(dels.length, adds.length);
			for (let i = 0; i < paired; i++) rows.push({
				kind: "pair",
				left: dels[i],
				right: adds[i]
			});
			for (let i = paired; i < dels.length; i++) rows.push({
				kind: "del",
				left: dels[i],
				right: null
			});
			for (let i = paired; i < adds.length; i++) rows.push({
				kind: "add",
				left: null,
				right: adds[i]
			});
		}
		function parseUnifiedDiff(text) {
			if (text === "") return EMPTY_DIFF;
			const lines = text.split("\n");
			if (lines[lines.length - 1] === "") lines.pop();
			const result = {
				...EMPTY_DIFF,
				hunks: []
			};
			let oldNo = 0;
			let newNo = 0;
			let runDels = [];
			let runAdds = [];
			let lastCell = null;
			const flushRun = (current) => {
				if (current !== null && (runDels.length > 0 || runAdds.length > 0)) pairRun(runDels, runAdds, current.rows);
				runDels = [];
				runAdds = [];
			};
			const startHunk = (match, current) => {
				flushRun(current);
				const created = {
					oldStart: Number(match[1]),
					oldCount: match[2] === void 0 ? 1 : Number(match[2]),
					newStart: Number(match[3]),
					newCount: match[4] === void 0 ? 1 : Number(match[4]),
					section: (match[5] ?? "").trim(),
					rows: []
				};
				result.hunks.push(created);
				oldNo = created.oldStart;
				newNo = created.newStart;
				return created;
			};
			let hunk = null;
			for (const line of lines) {
				if (line.startsWith("diff --git ")) {
					flushRun(hunk);
					hunk = null;
					continue;
				}
				if (hunk === null) {
					const hunkMatch = HUNK_RE.exec(line);
					if (hunkMatch !== null) hunk = startHunk(hunkMatch, hunk);
					else if (line.startsWith("--- ")) {
						const field = line.slice(4).trim();
						if (field === "/dev/null") result.newFile = true;
						else result.oldPath = stripPrefix(field);
					} else if (line.startsWith("+++ ")) {
						const field = line.slice(4).trim();
						if (field === "/dev/null") result.deletedFile = true;
						else result.newPath = stripPrefix(field);
					} else if (line.startsWith("rename from ") || line.startsWith("rename to ")) result.rename = true;
					else if (line.startsWith("Binary files ") || line === "GIT binary patch") result.binary = true;
					continue;
				}
				if (line.startsWith("@")) {
					const hunkMatch = HUNK_RE.exec(line);
					hunk = hunkMatch !== null ? startHunk(hunkMatch, hunk) : (flushRun(hunk), hunk);
					continue;
				}
				if (line.startsWith("\\")) {
					if (lastCell !== null) lastCell.noNewline = true;
					continue;
				}
				if (line.startsWith("-")) {
					lastCell = {
						no: oldNo++,
						text: line.slice(1)
					};
					runDels.push(lastCell);
					continue;
				}
				if (line.startsWith("+")) {
					lastCell = {
						no: newNo++,
						text: line.slice(1)
					};
					runAdds.push(lastCell);
					continue;
				}
				if (line.startsWith(" ") || line === "") {
					flushRun(hunk);
					const text = line === "" ? "" : line.slice(1);
					hunk.rows.push({
						kind: "ctx",
						left: {
							no: oldNo++,
							text
						},
						right: {
							no: newNo++,
							text
						}
					});
					continue;
				}
				flushRun(hunk);
				hunk = null;
			}
			flushRun(hunk);
			return result;
		}
		function rowHasMatch(row, engine) {
			if (!engine.active) return false;
			return row.left !== null && engine.test(row.left.text) || row.right !== null && engine.test(row.right.text);
		}
		function countMatchRows(parsed, engine) {
			if (!engine.active) return 0;
			let count = 0;
			for (const hunk of parsed.hunks) for (const row of hunk.rows) if (rowHasMatch(row, engine)) count += 1;
			return count;
		}
		function makeSearchEngine(spec) {
			const query = spec.query;
			const empty = {
				parts: (text) => [text],
				count: () => 0,
				test: () => false,
				active: false
			};
			if (query.trim() === "") return empty;
			const flags = (spec.caseSensitive ? "" : "i") + (spec.regex ? "g" : "g");
			if (spec.regex === true) {
				let re;
				try {
					re = new RegExp(query, flags);
				} catch {
					return empty;
				}
				return {
					parts: (text) => {
						const out = [];
						let cursor = 0;
						re.lastIndex = 0;
						let match;
						while ((match = re.exec(text)) !== null) {
							if (match.index === re.lastIndex) re.lastIndex += 1;
							out.push(text.slice(cursor, match.index), match[0]);
							cursor = match.index + match[0].length;
						}
						out.push(text.slice(cursor));
						return out.length === 1 ? out : out;
					},
					count: (text) => {
						let countValue = 0;
						re.lastIndex = 0;
						let match;
						while ((match = re.exec(text)) !== null) {
							countValue += 1;
							if (match.index === re.lastIndex) re.lastIndex += 1;
						}
						return countValue;
					},
					test: (text) => {
						re.lastIndex = 0;
						return re.test(text);
					},
					active: true
				};
			}
			const q = spec.caseSensitive ? query : query.toLowerCase();
			const lowerCached = new Map();
			const lower = (text) => {
				const cached = lowerCached.get(text);
				if (cached !== void 0) return cached;
				const value = spec.caseSensitive ? text : text.toLowerCase();
				if (lowerCached.size < 5e3) lowerCached.set(text, value);
				return value;
			};
			return {
				parts: (text) => {
					const haystack = lower(text);
					const parts = [];
					let cursor = 0;
					let at = haystack.indexOf(q);
					while (at !== -1) {
						parts.push(text.slice(cursor, at), text.slice(at, at + q.length));
						cursor = at + q.length;
						at = haystack.indexOf(q, cursor);
					}
					parts.push(text.slice(cursor));
					return parts;
				},
				count: (text) => {
					const haystack = lower(text);
					let countValue = 0;
					let at = haystack.indexOf(q);
					while (at !== -1) {
						countValue += 1;
						at = haystack.indexOf(q, at + q.length);
					}
					return countValue;
				},
				test: (text) => lower(text).includes(q),
				active: true
			};
		}
		function unifyHunkRows(rows) {
			const out = [];
			for (const row of rows) {
				if (row.kind === "pair") {
					if (row.left !== null) out.push({
						kind: "del",
						no: row.left.no,
						text: row.left.text,
						noNewline: row.left.noNewline,
						pair: row
					});
					if (row.right !== null) out.push({
						kind: "add",
						no: row.right.no,
						text: row.right.text,
						noNewline: row.right.noNewline,
						pair: row
					});
					continue;
				}
				if (row.kind === "ctx") {
					if (row.left !== null) out.push({
						kind: "ctx",
						no: row.left.no,
						text: row.left.text,
						noNewline: row.left.noNewline,
						pair: row
					});
				} else if (row.kind === "del") {
					if (row.left !== null) out.push({
						kind: "del",
						no: row.left.no,
						text: row.left.text,
						noNewline: row.left.noNewline,
						pair: row
					});
				} else if (row.kind === "add") {
					if (row.right !== null) out.push({
						kind: "add",
						no: row.right.no,
						text: row.right.text,
						noNewline: row.right.noNewline,
						pair: row
					});
				}
			}
			return out;
		}
		function countUnifiedMatches(parsed, engine) {
			if (!engine.active) return 0;
			let count = 0;
			for (const hunk of parsed.hunks) for (const line of unifyHunkRows(hunk.rows)) if (engine.test(line.text)) count += 1;
			return count;
		}
		const WORD_HIGHLIGHT_BUDGET = 2e6;
		const WORD_HIGHLIGHT_MIN_RATIO = .3;
		function dissolveTrivialEqualities(marks) {
			for (;;) {
				let dissolved = false;
				let k = 0;
				while (k < marks.length) {
					if (marks[k] === 1) {
						k += 1;
						continue;
					}
					let end = k;
					while (end < marks.length && marks[end] === 0) end += 1;
					if (k > 0 && end < marks.length) {
						let left = k - 1;
						while (left >= 0 && marks[left] === 1) left -= 1;
						const leftLen = k - 1 - left;
						let right = end;
						while (right < marks.length && marks[right] === 1) right += 1;
						const rightLen = right - end;
						if (end - k <= leftLen && end - k <= rightLen) {
							marks.fill(1, k, end);
							dissolved = true;
						}
					}
					k = end;
				}
				if (!dissolved) return;
			}
		}
		function lcsWordRegions(a, b) {
			if (a.length === 0 || b.length === 0) return null;
			if (a.length > 240 || b.length > 240) return null;
			if (a === b) return null;
			const rows = a.length + 1;
			const cols = b.length + 1;
			const dp = new Uint16Array(rows * cols);
			for (let i = 1; i < rows; i++) {
				const ca = a.charCodeAt(i - 1);
				for (let j = 1; j < cols; j++) dp[i * cols + j] = ca === b.charCodeAt(j - 1) ? dp[(i - 1) * cols + j - 1] + 1 : Math.max(dp[(i - 1) * cols + j], dp[i * cols + j - 1]);
			}
			if (dp[rows * cols - 1] / Math.max(a.length, b.length) < WORD_HIGHLIGHT_MIN_RATIO) return null;
			const oldMarks = new Uint8Array(a.length);
			const newMarks = new Uint8Array(b.length);
			let i = a.length;
			let j = b.length;
			while (i > 0 && j > 0) {
				if (a.charCodeAt(i - 1) === b.charCodeAt(j - 1)) {
					i -= 1;
					j -= 1;
					continue;
				}
				if (dp[(i - 1) * cols + j] >= dp[i * cols + j - 1]) {
					oldMarks[i - 1] = 1;
					i -= 1;
				} else {
					newMarks[j - 1] = 1;
					j -= 1;
				}
			}
			while (i > 0) {
				oldMarks[i - 1] = 1;
				i -= 1;
			}
			while (j > 0) {
				newMarks[j - 1] = 1;
				j -= 1;
			}
			dissolveTrivialEqualities(oldMarks);
			dissolveTrivialEqualities(newMarks);
			const spansOf = (marks) => {
				const spans = [];
				let start = -1;
				for (let k = 0; k < marks.length; k++) {
					if (marks[k] === 1 && start === -1) start = k;
					if (marks[k] === 0 && start !== -1) {
						spans.push([start, k]);
						start = -1;
					}
				}
				if (start !== -1) spans.push([start, marks.length]);
				return spans;
			};
			return {
				old: spansOf(oldMarks),
				new: spansOf(newMarks)
			};
		}
		function makeWordHighlighter(budget = WORD_HIGHLIGHT_BUDGET) {
			let remaining = budget;
			const memo = new WeakMap();
			return { pair(row) {
				if (row.kind !== "pair" || row.left === null || row.right === null) return null;
				const cached = memo.get(row);
				if (cached !== void 0) return cached;
				let regions = null;
				const left = row.left.text;
				const right = row.right.text;
				if (left.length <= 240 && right.length <= 240 && left.length > 0 && right.length > 0 && left !== right) {
					const cost = left.length * right.length;
					if (cost <= remaining) {
						remaining -= cost;
						regions = lcsWordRegions(left, right);
					}
				}
				memo.set(row, regions);
				return regions;
			} };
		}
		//#endregion
		//#region src/client/highlight.ts
		function langOf(path) {
			const name = path.split("/").pop() ?? path;
			const dot = name.lastIndexOf(".");
			if (dot <= 0) return null;
			const ext = name.slice(dot + 1).toLowerCase();
			if ([
				"js",
				"jsx",
				"mjs",
				"cjs",
				"ts",
				"tsx",
				"mts",
				"cts"
			].includes(ext)) return "c";
			if ([
				"json",
				"jsonc",
				"json5"
			].includes(ext)) return "json";
			if ([
				"py",
				"pyw",
				"pyi"
			].includes(ext)) return "py";
			if ([
				"sh",
				"bash",
				"zsh",
				"ps1",
				"dockerfile"
			].includes(ext) || /^dockerfile/i.test(name)) return "sh";
			if ([
				"css",
				"scss",
				"less"
			].includes(ext)) return "css";
			if ([
				"go",
				"rs",
				"java",
				"kt",
				"swift",
				"c",
				"h",
				"cpp",
				"hpp",
				"cc",
				"cs",
				"php",
				"dart",
				"vue"
			].includes(ext)) return "c";
			if (ext === "sql") return "sql";
			if ([
				"yml",
				"yaml",
				"toml",
				"ini",
				"conf"
			].includes(ext)) return "sh";
			if (["md", "markdown"].includes(ext)) return null;
			return null;
		}
		const KEYWORDS = {
			c: new Set([
				"abstract",
				"as",
				"async",
				"await",
				"base",
				"break",
				"case",
				"catch",
				"class",
				"const",
				"const_cast",
				"continue",
				"crate",
				"debugger",
				"declare",
				"default",
				"delete",
				"do",
				"dyn",
				"else",
				"enum",
				"export",
				"extends",
				"false",
				"final",
				"finally",
				"fn",
				"for",
				"from",
				"func",
				"function",
				"get",
				"go",
				"goto",
				"if",
				"impl",
				"implements",
				"import",
				"in",
				"instanceof",
				"interface",
				"is",
				"let",
				"loop",
				"match",
				"mod",
				"mut",
				"namespace",
				"new",
				"not",
				"null",
				"nullptr",
				"operator",
				"or",
				"package",
				"private",
				"protected",
				"public",
				"pub",
				"readonly",
				"ref",
				"require",
				"return",
				"self",
				"set",
				"signed",
				"static",
				"std",
				"struct",
				"super",
				"switch",
				"template",
				"this",
				"throw",
				"throws",
				"trait",
				"true",
				"try",
				"type",
				"typedef",
				"typeof",
				"union",
				"unsigned",
				"unsafe",
				"use",
				"using",
				"var",
				"virtual",
				"void",
				"where",
				"while",
				"with",
				"yield"
			]),
			py: new Set([
				"and",
				"as",
				"assert",
				"async",
				"await",
				"break",
				"class",
				"continue",
				"def",
				"del",
				"elif",
				"else",
				"except",
				"False",
				"finally",
				"for",
				"from",
				"global",
				"if",
				"import",
				"in",
				"is",
				"lambda",
				"None",
				"nonlocal",
				"not",
				"or",
				"pass",
				"raise",
				"return",
				"True",
				"try",
				"while",
				"with",
				"yield"
			]),
			sh: new Set([
				"case",
				"do",
				"done",
				"elif",
				"else",
				"esac",
				"fi",
				"for",
				"function",
				"if",
				"in",
				"return",
				"select",
				"then",
				"until",
				"while",
				"export",
				"local",
				"set",
				"source",
				"echo",
				"cd"
			]),
			sql: new Set([
				"select",
				"from",
				"where",
				"join",
				"left",
				"right",
				"inner",
				"outer",
				"on",
				"group",
				"order",
				"by",
				"having",
				"limit",
				"offset",
				"insert",
				"into",
				"values",
				"update",
				"set",
				"delete",
				"create",
				"table",
				"alter",
				"drop",
				"index",
				"view",
				"as",
				"and",
				"or",
				"not",
				"null",
				"true",
				"false",
				"distinct",
				"union",
				"all",
				"exists",
				"in",
				"between",
				"like",
				"is",
				"case",
				"when",
				"then",
				"else",
				"end",
				"primary",
				"key",
				"foreign",
				"references",
				"default",
				"constraint",
				"unique"
			]),
			json: new Set([
				"true",
				"false",
				"null"
			]),
			css: new Set([
				"important",
				"inherit",
				"initial",
				"unset",
				"var",
				"url",
				"calc",
				"rgba",
				"rgb",
				"color-mix"
			])
		};
		const LINE_COMMENT = {
			sql: ["--"],
			c: ["//"],
			py: ["#"],
			sh: ["#"],
			json: ["//"],
			css: ["//"]
		};
		const STRING_QUOTES = {
			sql: ["'", "\""],
			c: [
				"\"",
				"'",
				"`"
			],
			py: ["\"", "'"],
			sh: ["\"", "'"],
			json: ["\""],
			css: ["\"", "'"]
		};
		function tokenizeLine(line, lang) {
			const keywords = KEYWORDS[lang];
			const comments = LINE_COMMENT[lang];
			const quotes = STRING_QUOTES[lang];
			if (keywords === void 0 || comments === void 0 || quotes === void 0) return [];
			const out = [];
			const push = (start, end, kind) => {
				if (end > start) out.push({
					start,
					end,
					kind
				});
			};
			let at = 0;
			const isWordChar = (ch) => /[A-Za-z0-9_$]/.test(ch);
			while (at < line.length) {
				if (comments.find((marker) => line.startsWith(marker, at)) !== void 0) {
					push(at, line.length, "com");
					break;
				}
				const ch = line[at];
				if (quotes.includes(ch)) {
					let end = at + 1;
					while (end < line.length) {
						if (line[end] === "\\") {
							end += 2;
							continue;
						}
						if (line[end] === ch) {
							end += 1;
							break;
						}
						end += 1;
					}
					push(at, Math.min(end, line.length), "str");
					at = Math.min(end, line.length);
					continue;
				}
				if (/[0-9]/.test(ch) && (at === 0 || !isWordChar(line[at - 1]))) {
					let end = at;
					while (end < line.length && /[0-9a-fA-FxXoObB._]/.test(line[end])) end += 1;
					push(at, end, "num");
					at = end;
					continue;
				}
				if (isWordChar(ch)) {
					let end = at;
					while (end < line.length && isWordChar(line[end])) end += 1;
					if (keywords.has(line.slice(at, end))) push(at, end, "kw");
					at = end;
					continue;
				}
				at += 1;
			}
			return out;
		}
		function makeLineHighlighter(path, budget = 4e6) {
			const lang = langOf(path);
			if (lang === null) return { line: () => null };
			let left = budget;
			const cache = new Map();
			return { line(text) {
				if (cache.has(text)) return cache.get(text);
				if (left <= 0) return null;
				left -= text.length;
				const tokens = left > 0 ? tokenizeLine(text, lang) : null;
				if (cache.size > 8e3) cache.clear();
				cache.set(text, tokens);
				return tokens;
			} };
		}
		function sliceTokens(tokens, from, to) {
			if (tokens === null) return null;
			const out = [];
			for (const token of tokens) {
				const start = Math.max(token.start, from);
				const end = Math.min(token.end, to);
				if (end > start) out.push({
					start: start - from,
					end: end - from,
					kind: token.kind
				});
			}
			return out;
		}
		function splitLineByTokens(text, tokens) {
			if (tokens === null || tokens.length === 0) return text === "" ? [] : [{
				start: 0,
				end: text.length,
				kind: null
			}];
			const segs = [];
			let cursor = 0;
			for (const token of tokens) {
				const start = Math.max(0, Math.min(token.start, text.length));
				const end = Math.max(start, Math.min(token.end, text.length));
				if (start > cursor) segs.push({
					start: cursor,
					end: start,
					kind: null
				});
				if (end > start) segs.push({
					start,
					end,
					kind: token.kind
				});
				cursor = Math.max(cursor, end);
			}
			if (cursor < text.length) segs.push({
				start: cursor,
				end: text.length,
				kind: null
			});
			return segs;
		}
		//#endregion
		//#region src/client/icon-paths.ts
		const ICON_VIEWBOX = "0 0 24 24";
		const LOGO_PATHS = {
			typescript: "M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 27.72 27.72 0 0 0-1.007-.436c-.918-.383-1.602-.852-2.053-1.405-.45-.553-.676-1.222-.676-2.005 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 7.536 7.536 0 0 1 1.77-.201zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z",
			javascript: "M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.089c-.676.165-1.32.525-1.71 1.005-1.14 1.291-.811 3.541.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 6.09 1.666 6.871-1.004.029-.09.24-.705.074-1.65l.046.067zm-8.983-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z",
			python: "M14.25.18l.9.2.73.26.59.3.45.32.34.34.25.34.16.33.1.3.04.26.02.2-.01.13V8.5l-.05.63-.13.55-.21.46-.26.38-.3.31-.33.25-.35.19-.35.14-.33.1-.3.07-.26.04-.21.02H8.77l-.69.05-.59.14-.5.22-.41.27-.33.32-.27.35-.2.36-.15.37-.1.35-.07.32-.04.27-.02.21v3.06H3.17l-.21-.03-.28-.07-.32-.12-.35-.18-.36-.26-.36-.36-.35-.46-.32-.59-.28-.73-.21-.88-.14-1.05-.05-1.23.06-1.22.16-1.04.24-.87.32-.71.36-.57.4-.44.42-.33.42-.24.4-.16.36-.1.32-.05.24-.01h.16l.06.01h8.16v-.83H6.18l-.01-2.75-.02-.37.05-.34.11-.31.17-.28.25-.26.31-.23.38-.2.44-.18.51-.15.58-.12.64-.1.71-.06.77-.04.84-.02 1.27.05zm-6.3 1.98l-.23.33-.08.41.08.41.23.34.33.22.41.09.41-.09.33-.22.23-.34.08-.41-.08-.41-.23-.33-.33-.22-.41-.09-.41.09zm13.09 3.95l.28.06.32.12.35.18.36.27.36.35.35.47.32.59.28.73.21.88.14 1.04.05 1.23-.06 1.23-.16 1.04-.24.86-.32.71-.36.57-.4.45-.42.33-.42.24-.4.16-.36.09-.32.05-.24.02-.16-.01h-8.22v.82h5.84l.01 2.76.02.36-.05.34-.11.31-.17.29-.25.25-.31.24-.38.2-.44.17-.51.15-.58.13-.64.09-.71.07-.77.04-.84.01-1.27-.04-1.07-.14-.9-.2-.73-.25-.59-.3-.45-.33-.34-.34-.25-.34-.16-.33-.1-.3-.04-.25-.02-.2.01-.13v-5.34l.05-.64.13-.54.21-.46.26-.38.3-.32.33-.24.35-.2.35-.14.33-.1.3-.06.26-.04.21-.02.13-.01h5.84l.69-.05.59-.14.5-.21.41-.28.33-.32.27-.35.2-.36.15-.36.1-.35.07-.32.04-.28.02-.21V6.07h2.09l.14.01zm-6.47 14.25l-.23.33-.08.41.08.41.23.33.33.23.41.08.41-.08.33-.23.23-.33.08-.41-.08-.41-.23-.33-.33-.23-.41-.08-.41.08z",
			markdown: "M22.27 19.385H1.73A1.73 1.73 0 010 17.655V6.345a1.73 1.73 0 011.73-1.73h20.54A1.73 1.73 0 0124 6.345v11.308a1.73 1.73 0 01-1.73 1.731zM5.769 15.923v-4.5l2.308 2.885 2.307-2.885v4.5h2.308V8.078h-2.308l-2.307 2.885-2.308-2.885H3.46v7.847zM21.232 12h-2.309V8.077h-2.307V12h-2.308l3.461 4.039z",
			rust: "M23.8346 11.7033l-1.0073-.6236a13.7268 13.7268 0 00-.0283-.2936l.8656-.8069a.3483.3483 0 00-.1154-.578l-1.1066-.414a8.4958 8.4958 0 00-.087-.2856l.6904-.9587a.3462.3462 0 00-.2257-.5446l-1.1663-.1894a9.3574 9.3574 0 00-.1407-.2622l.49-1.0761a.3437.3437 0 00-.0274-.3361.3486.3486 0 00-.3006-.154l-1.1845.0416a6.7444 6.7444 0 00-.1873-.2268l.2723-1.153a.3472.3472 0 00-.417-.4172l-1.1532.2724a14.0183 14.0183 0 00-.2278-.1873l.0415-1.1845a.3442.3442 0 00-.49-.328l-1.076.491c-.0872-.0476-.1742-.0952-.2623-.1407l-.1903-1.1673A.3483.3483 0 0016.256.955l-.9597.6905a8.4867 8.4867 0 00-.2855-.086l-.414-1.1066a.3483.3483 0 00-.5781-.1154l-.8069.8666a9.2936 9.2936 0 00-.2936-.0284L12.2946.1683a.3462.3462 0 00-.5892 0l-.6236 1.0073a13.7383 13.7383 0 00-.2936.0284L9.9803.3374a.3462.3462 0 00-.578.1154l-.4141 1.1065c-.0962.0274-.1903.0567-.2855.086L7.744.955a.3483.3483 0 00-.5447.2258L7.009 2.348a9.3574 9.3574 0 00-.2622.1407l-1.0762-.491a.3462.3462 0 00-.49.328l.0416 1.1845a7.9826 7.9826 0 00-.2278.1873L3.8413 3.425a.3472.3472 0 00-.4171.4171l.2713 1.1531c-.0628.075-.1255.1509-.1863.2268l-1.1845-.0415a.3462.3462 0 00-.328.49l.491 1.0761a9.167 9.167 0 00-.1407.2622l-1.1662.1894a.3483.3483 0 00-.2258.5446l.6904.9587a13.303 13.303 0 00-.087.2855l-1.1065.414a.3483.3483 0 00-.1155.5781l.8656.807a9.2936 9.2936 0 00-.0283.2935l-1.0073.6236a.3442.3442 0 000 .5892l1.0073.6236c.008.0982.0182.1964.0283.2936l-.8656.8079a.3462.3462 0 00.1155.578l1.1065.4141c.0273.0962.0567.1914.087.2855l-.6904.9587a.3452.3452 0 00.2268.5447l1.1662.1893c.0456.088.0922.1751.1408.2622l-.491 1.0762a.3462.3462 0 00.328.49l1.1834-.0415c.0618.0769.1235.1528.1873.2277l-.2713 1.1541a.3462.3462 0 00.4171.4161l1.153-.2713c.075.0638.151.1255.2279.1863l-.0415 1.1845a.3442.3442 0 00.49.327l1.0761-.49c.087.0486.1741.0951.2622.1407l.1903 1.1662a.3483.3483 0 00.5447.2268l.9587-.6904a9.299 9.299 0 00.2855.087l.414 1.1066a.3452.3452 0 00.5781.1154l.8079-.8656c.0972.0111.1954.0203.2936.0294l.6236 1.0073a.3472.3472 0 00.5892 0l.6236-1.0073c.0982-.0091.1964-.0183.2936-.0294l.8069.8656a.3483.3483 0 00.578-.1154l.4141-1.1066a8.4626 8.4626 0 00.2855-.087l.9587.6904a.3452.3452 0 00.5447-.2268l.1903-1.1662c.088-.0456.1751-.0931.2622-.1407l1.0762.49a.3472.3472 0 00.49-.327l-.0415-1.1845a6.7267 6.7267 0 00.2267-.1863l1.1531.2713a.3472.3472 0 00.4171-.416l-.2713-1.1542c.0628-.0749.1255-.1508.1863-.2278l1.1845.0415a.3442.3442 0 00.328-.49l-.49-1.076c.0475-.0872.0951-.1742.1407-.2623l1.1662-.1893a.3483.3483 0 00.2258-.5447l-.6904-.9587.087-.2855 1.1066-.414a.3462.3462 0 00.1154-.5781l-.8656-.8079c.0101-.0972.0202-.1954.0283-.2936l1.0073-.6236a.3442.3442 0 000-.5892zm-6.7413 8.3551a.7138.7138 0 01.2986-1.396.714.714 0 11-.2997 1.396zm-.3422-2.3142a.649.649 0 00-.7715.5l-.3573 1.6685c-1.1035.501-2.3285.7795-3.6193.7795a8.7368 8.7368 0 01-3.6951-.814l-.3574-1.6684a.648.648 0 00-.7714-.499l-1.473.3158a8.7216 8.7216 0 01-.7613-.898h7.1676c.081 0 .1356-.0141.1356-.088v-2.536c0-.074-.0536-.0881-.1356-.0881h-2.0966v-1.6077h2.2677c.2065 0 1.1065.0587 1.394 1.2088.0901.3533.2875 1.5044.4232 1.8729.1346.413.6833 1.2381 1.2685 1.2381h3.5716a.7492.7492 0 00.1296-.0131 8.7874 8.7874 0 01-.8119.9526zM6.8369 20.024a.714.714 0 11-.2997-1.396.714.714 0 01.2997 1.396zM4.1177 8.9972a.7137.7137 0 11-1.304.5791.7137.7137 0 011.304-.579zm-.8352 1.9813l1.5347-.6824a.65.65 0 00.33-.8585l-.3158-.7147h1.2432v5.6025H3.5669a8.7753 8.7753 0 01-.2834-3.348zm6.7343-.5437V8.7836h2.9601c.153 0 1.0792.1772 1.0792.8697 0 .575-.7107.7815-1.2948.7815zm10.7574 1.4862c0 .2187-.008.4363-.0243.651h-.9c-.09 0-.1265.0586-.1265.1477v.413c0 .973-.5487 1.1846-1.0296 1.2382-.4576.0517-.9648-.1913-1.0275-.4717-.2704-1.5186-.7198-1.8436-1.4305-2.4034.8817-.5599 1.799-1.386 1.799-2.4915 0-1.1936-.819-1.9458-1.3769-2.3153-.7825-.5163-1.6491-.6195-1.883-.6195H5.4682a8.7651 8.7651 0 014.907-2.7699l1.0974 1.151a.648.648 0 00.9182.0213l1.227-1.1743a8.7753 8.7753 0 016.0044 4.2762l-.8403 1.8982a.652.652 0 00.33.8585l1.6178.7188c.0283.2875.0425.577.0425.8717zm-9.3006-9.5993a.7128.7128 0 11.984 1.0316.7137.7137 0 01-.984-1.0316zm8.3389 6.71a.7107.7107 0 01.9395-.3625.7137.7137 0 11-.9405.3635z",
			html5: "M1.5 0h21l-1.91 21.563L11.977 24l-8.564-2.438L1.5 0zm7.031 9.75l-.232-2.718 10.059.003.23-2.622L5.412 4.41l.698 8.01h9.126l-.326 3.426-2.91.804-2.955-.81-.188-2.11H6.248l.33 4.171L12 19.351l5.379-1.443.744-8.157H8.531z",
			css3: "M1.5 0h21l-1.91 21.563L11.977 24l-8.565-2.438L1.5 0zm17.09 4.413L5.41 4.41l.213 2.622 10.125.002-.255 2.716h-6.64l.24 2.573h6.182l-.366 3.523-2.91.804-2.956-.81-.188-2.11h-2.61l.29 3.855L12 19.288l5.373-1.53L18.59 4.414z",
			go: "M1.811 10.231c-.047 0-.058-.023-.035-.059l.246-.315c.023-.035.081-.058.128-.058h4.172c.046 0 .058.035.035.07l-.199.303c-.023.036-.082.07-.117.07zM.047 11.306c-.047 0-.059-.023-.035-.058l.245-.316c.023-.035.082-.058.129-.058h5.328c.047 0 .07.035.058.07l-.093.28c-.012.047-.058.07-.105.07zm2.828 1.075c-.047 0-.059-.035-.035-.07l.163-.292c.023-.035.07-.07.117-.07h2.337c.047 0 .07.035.07.082l-.023.28c0 .047-.047.082-.082.082zm12.129-2.36c-.736.187-1.239.327-1.963.514-.176.046-.187.058-.34-.117-.174-.199-.303-.327-.548-.444-.737-.362-1.45-.257-2.115.175-.795.514-1.204 1.274-1.192 2.22.011.935.654 1.706 1.577 1.835.795.105 1.46-.175 1.987-.77.105-.13.198-.27.315-.434H10.47c-.245 0-.304-.152-.222-.35.152-.362.432-.97.596-1.274a.315.315 0 01.292-.187h4.253c-.023.316-.023.631-.07.947a4.983 4.983 0 01-.958 2.29c-.841 1.11-1.94 1.8-3.33 1.986-1.145.152-2.209-.07-3.143-.77-.865-.655-1.356-1.52-1.484-2.595-.152-1.274.222-2.419.993-3.424.83-1.086 1.928-1.776 3.272-2.02 1.098-.2 2.15-.07 3.096.571.62.41 1.063.97 1.356 1.648.07.105.023.164-.117.2m3.868 6.461c-1.064-.024-2.034-.328-2.852-1.029a3.665 3.665 0 01-1.262-2.255c-.21-1.32.152-2.489.947-3.529.853-1.122 1.881-1.706 3.272-1.95 1.192-.21 2.314-.095 3.33.595.923.63 1.496 1.484 1.648 2.605.198 1.578-.257 2.863-1.344 3.962-.771.783-1.718 1.273-2.805 1.495-.315.06-.63.07-.934.106zm2.78-4.72c-.011-.153-.011-.27-.034-.387-.21-1.157-1.274-1.81-2.384-1.554-1.087.245-1.788.935-2.045 2.033-.21.912.234 1.835 1.075 2.21.643.28 1.285.244 1.905-.07.923-.48 1.425-1.228 1.484-2.233z",
			php: "M7.01 10.207h-.944l-.515 2.648h.838c.556 0 .97-.105 1.242-.314.272-.21.455-.559.55-1.049.092-.47.05-.802-.124-.995-.175-.193-.523-.29-1.047-.29zM12 5.688C5.373 5.688 0 8.514 0 12s5.373 6.313 12 6.313S24 15.486 24 12c0-3.486-5.373-6.312-12-6.312zm-3.26 7.451c-.261.25-.575.438-.917.551-.336.108-.765.164-1.285.164H5.357l-.327 1.681H3.652l1.23-6.326h2.65c.797 0 1.378.209 1.744.628.366.418.476 1.002.33 1.752a2.836 2.836 0 0 1-.305.847c-.143.255-.33.49-.561.703zm4.024.715l.543-2.799c.063-.318.039-.536-.068-.651-.107-.116-.336-.174-.687-.174H11.46l-.704 3.625H9.388l1.23-6.327h1.367l-.327 1.682h1.218c.767 0 1.295.134 1.586.401s.378.7.263 1.299l-.572 2.944h-1.389zm7.597-2.265a2.782 2.782 0 0 1-.305.847c-.143.255-.33.49-.561.703a2.44 2.44 0 0 1-.917.551c-.336.108-.765.164-1.286.164h-1.18l-.327 1.682h-1.378l1.23-6.326h2.649c.797 0 1.378.209 1.744.628.366.417.477 1.001.331 1.751zM17.766 10.207h-.943l-.516 2.648h.838c.557 0 .971-.105 1.242-.314.272-.21.455-.559.551-1.049.092-.47.049-.802-.125-.995s-.524-.29-1.047-.29z",
			ruby: "M20.156.083c3.033.525 3.893 2.598 3.829 4.77L24 4.822 22.635 22.71 4.89 23.926h.016C3.433 23.864.15 23.729 0 19.139l1.645-3 2.819 6.586.503 1.172 2.805-9.144-.03.007.016-.03 9.255 2.956-1.396-5.431-.99-3.9 8.82-.569-.615-.51L16.5 2.114 20.159.073l-.003.01zM0 19.089zM5.13 5.073c3.561-3.533 8.157-5.621 9.922-3.84 1.762 1.777-.105 6.105-3.673 9.636-3.563 3.532-8.103 5.734-9.864 3.957-1.766-1.777.045-6.217 3.612-9.75l.003-.003z",
			openjdk: "M11.915 0 11.7.215C9.515 2.4 7.47 6.39 6.046 10.483c-1.064 1.024-3.633 2.81-3.711 3.551-.093.87 1.746 2.611 1.55 3.235-.198.625-1.304 1.408-1.014 1.939.1.188.823.011 1.277-.491a13.389 13.389 0 0 0-.017 2.14c.076.906.27 1.668.643 2.232.372.563.956.911 1.667.911.397 0 .727-.114 1.024-.264.298-.149.571-.33.91-.5.68-.34 1.634-.666 3.53-.604 1.903.062 2.872.39 3.559.704.687.314 1.15.664 1.925.664.767 0 1.395-.336 1.807-.9.412-.563.631-1.33.72-2.24.06-.623.055-1.32 0-2.066.454.45 1.117.604 1.213.424.29-.53-.816-1.314-1.013-1.937-.198-.624 1.642-2.366 1.549-3.236-.08-.748-2.707-2.568-3.748-3.586C16.428 6.374 14.308 2.394 12.13.215zm.175 6.038a2.95 2.95 0 0 1 2.943 2.942 2.95 2.95 0 0 1-2.943 2.943A2.95 2.95 0 0 1 9.148 8.98a2.95 2.95 0 0 1 2.942-2.942zM8.685 7.983a3.515 3.515 0 0 0-.145.997c0 1.951 1.6 3.55 3.55 3.55 1.95 0 3.55-1.598 3.55-3.55 0-.329-.046-.648-.132-.951.334.095.64.208.915.336a42.699 42.699 0 0 1 2.042 5.829c.678 2.545 1.01 4.92.846 6.607-.082.844-.29 1.51-.606 1.94-.315.431-.713.651-1.315.651-.593 0-.932-.27-1.673-.61-.741-.338-1.825-.694-3.792-.758-1.974-.064-3.073.293-3.821.669-.375.188-.659.373-.911.5s-.466.2-.752.2c-.53 0-.876-.209-1.16-.64-.285-.43-.474-1.101-.545-1.948-.141-1.693.176-4.069.823-6.614a43.155 43.155 0 0 1 1.934-5.783c.348-.167.749-.31 1.192-.425zm-3.382 4.362a.216.216 0 0 1 .13.031c-.166.56-.323 1.116-.463 1.665a33.849 33.849 0 0 0-.547 2.555 3.9 3.9 0 0 0-.2-.39c-.58-1.012-.914-1.642-1.16-2.08.315-.24 1.679-1.755 2.24-1.781zm13.394.01c.562.027 1.926 1.543 2.24 1.783-.246.438-.58 1.068-1.16 2.08a4.428 4.428 0 0 0-.163.309 32.354 32.354 0 0 0-.562-2.49 40.579 40.579 0 0 0-.482-1.652.216.216 0 0 1 .127-.03z",
			kotlin: "M24 24H0V0h24L12 12Z",
			swift: "M7.508 0c-.287 0-.573 0-.86.002-.241.002-.483.003-.724.01-.132.003-.263.009-.395.015A9.154 9.154 0 0 0 4.348.15 5.492 5.492 0 0 0 2.85.645 5.04 5.04 0 0 0 .645 2.848c-.245.48-.4.972-.495 1.5-.093.52-.122 1.05-.136 1.576a35.2 35.2 0 0 0-.012.724C0 6.935 0 7.221 0 7.508v8.984c0 .287 0 .575.002.862.002.24.005.481.012.722.014.526.043 1.057.136 1.576.095.528.25 1.02.495 1.5a5.03 5.03 0 0 0 2.205 2.203c.48.244.97.4 1.498.495.52.093 1.05.124 1.576.138.241.007.483.009.724.01.287.002.573.002.86.002h8.984c.287 0 .573 0 .86-.002.241-.001.483-.003.724-.01a10.523 10.523 0 0 0 1.578-.138 5.322 5.322 0 0 0 1.498-.495 5.035 5.035 0 0 0 2.203-2.203c.245-.48.4-.972.495-1.5.093-.52.124-1.05.138-1.576.007-.241.009-.481.01-.722.002-.287.002-.575.002-.862V7.508c0-.287 0-.573-.002-.86a33.662 33.662 0 0 0-.01-.724 10.5 10.5 0 0 0-.138-1.576 5.328 5.328 0 0 0-.495-1.5A5.039 5.039 0 0 0 21.152.645 5.32 5.32 0 0 0 19.654.15a10.493 10.493 0 0 0-1.578-.138 34.98 34.98 0 0 0-.722-.01C17.067 0 16.779 0 16.492 0H7.508zm6.035 3.41c4.114 2.47 6.545 7.162 5.549 11.131-.024.093-.05.181-.076.272l.002.001c2.062 2.538 1.5 5.258 1.236 4.745-1.072-2.086-3.066-1.568-4.088-1.043a6.803 6.803 0 0 1-.281.158l-.02.012-.002.002c-2.115 1.123-4.957 1.205-7.812-.022a12.568 12.568 0 0 1-5.64-4.838c.649.48 1.35.902 2.097 1.252 3.019 1.414 6.051 1.311 8.197-.002C9.651 12.73 7.101 9.67 5.146 7.191a10.628 10.628 0 0 1-1.005-1.384c2.34 2.142 6.038 4.83 7.365 5.576C8.69 8.408 6.208 4.743 6.324 4.86c4.436 4.47 8.528 6.996 8.528 6.996.154.085.27.154.36.213.085-.215.16-.437.224-.668.708-2.588-.09-5.548-1.893-7.992z",
			yaml: "m0 .97 4.111 6.453v4.09h2.638v-4.09L11.053.969H8.214L5.58 5.125 2.965.969Zm12.093.024-4.47 10.544h2.114l.97-2.345h4.775l.804 2.345h2.26L14.255.994Zm1.133 2.225 1.463 3.87h-3.096zm3.06 9.475v10.29H24v-2.199h-5.454v-8.091zm-12.175.002v10.335h2.217v-7.129l2.32 4.792h1.746l2.4-4.96v7.295h2.127V12.696h-2.904L9.44 17.37l-2.455-4.674Z",
			json: "M12.043 23.968c.479-.004.953-.029 1.426-.094a11.805 11.805 0 003.146-.863 12.404 12.404 0 003.793-2.542 11.977 11.977 0 002.44-3.427 11.794 11.794 0 001.02-3.476c.149-1.16.135-2.346-.045-3.499a11.96 11.96 0 00-.793-2.788 11.197 11.197 0 00-.854-1.617c-1.168-1.837-2.861-3.314-4.81-4.3a12.835 12.835 0 00-2.172-.87h-.005c.119.063.24.132.345.201.12.074.239.146.351.225a8.93 8.93 0 011.559 1.33c1.063 1.145 1.797 2.548 2.218 4.041.284.982.434 1.998.495 3.017.044.743.044 1.491-.047 2.229-.149 1.27-.554 2.51-1.228 3.596a7.475 7.475 0 01-1.903 2.084c-1.244.928-2.877 1.482-4.436 1.114a3.916 3.916 0 01-.748-.258 4.692 4.692 0 01-.779-.45 6.08 6.08 0 01-1.244-1.105 6.507 6.507 0 01-1.049-1.747 7.366 7.366 0 01-.494-2.54c-.03-1.273.225-2.553.854-3.67a6.43 6.43 0 011.663-1.918c.225-.178.464-.333.704-.479l.016-.007a5.121 5.121 0 00-1.441-.12 4.963 4.963 0 00-1.228.24c-.359.12-.704.27-1.019.45a6.146 6.146 0 00-.733.494c-.211.18-.42.36-.615.555-1.123 1.153-1.768 2.682-2.022 4.256-.15.973-.15 1.96-.091 2.95.105 1.395.391 2.787.945 4.062a8.518 8.518 0 001.348 2.173 8.14 8.14 0 003.132 2.23 7.934 7.934 0 002.113.54c.074.015.149.015.209.015zm-2.934-.398a4.102 4.102 0 01-.45-.228 8.5 8.5 0 01-2.038-1.534c-1.094-1.137-1.827-2.566-2.247-4.08a15.184 15.184 0 01-.495-3.172 12.14 12.14 0 01.046-2.082c.135-1.257.495-2.501 1.124-3.58a6.889 6.889 0 011.783-2.053 6.23 6.23 0 011.633-.9 5.363 5.363 0 013.522-.045c.029 0 .029 0 .045.03.015.015.045.015.06.03.045.016.104.045.165.074.239.12.479.271.704.42a6.294 6.294 0 012.097 2.502c.42.914.615 1.934.631 2.938.014 1.079-.18 2.157-.645 3.146a6.42 6.42 0 01-2.638 2.832c.09.03.18.045.271.075.225.044.449.074.688.074 1.468.045 2.892-.66 3.94-1.647.195-.18.375-.375.54-.585.225-.27.435-.54.614-.823.239-.375.435-.75.614-1.154a8.112 8.112 0 00.509-1.664c.196-1.004.211-2.022.149-3.026-.135-2.022-.673-4.045-1.842-5.724a9.054 9.054 0 00-.555-.719 9.868 9.868 0 00-1.063-1.034 8.477 8.477 0 00-1.363-.915 9.927 9.927 0 00-1.692-.598l-.3-.06c-.209-.03-.42-.044-.634-.06a8.453 8.453 0 00-1.015.016c-.704.045-1.412.16-2.112.337C5.799 1.227 2.863 3.566 1.3 6.67A11.834 11.834 0 00.238 9.801a11.81 11.81 0 00-.104 3.775c.12 1.02.374 2.023.778 2.977.227.57.511 1.124.825 1.648 1.094 1.783 2.683 3.236 4.51 4.24.688.39 1.408.69 2.157.944.226.074.45.15.689.21z",
			toml: "M.014 0h5.34v2.652H2.888v18.681h2.468V24H.015V0Zm17.622 5.049v2.78h-4.274v12.935h-3.008V7.83H6.059V5.05h11.577ZM23.986 24h-5.34v-2.652h2.467V2.667h-2.468V0h5.34v24Z",
			svelte: "M10.354 21.125a4.44 4.44 0 0 1-4.765-1.767 4.109 4.109 0 0 1-.703-3.107 3.898 3.898 0 0 1 .134-.522l.105-.321.287.21a7.21 7.21 0 0 0 2.186 1.092l.208.063-.02.208a1.253 1.253 0 0 0 .226.83 1.337 1.337 0 0 0 1.435.533 1.231 1.231 0 0 0 .343-.15l5.59-3.562a1.164 1.164 0 0 0 .524-.778 1.242 1.242 0 0 0-.211-.937 1.338 1.338 0 0 0-1.435-.533 1.23 1.23 0 0 0-.343.15l-2.133 1.36a4.078 4.078 0 0 1-1.135.499 4.44 4.44 0 0 1-4.765-1.766 4.108 4.108 0 0 1-.702-3.108 3.855 3.855 0 0 1 1.742-2.582l5.589-3.563a4.072 4.072 0 0 1 1.135-.499 4.44 4.44 0 0 1 4.765 1.767 4.109 4.109 0 0 1 .703 3.107 3.943 3.943 0 0 1-.134.522l-.105.321-.286-.21a7.204 7.204 0 0 0-2.187-1.093l-.208-.063.02-.207a1.255 1.255 0 0 0-.226-.831 1.337 1.337 0 0 0-1.435-.532 1.231 1.231 0 0 0-.343.15L8.62 9.368a1.162 1.162 0 0 0-.524.778 1.24 1.24 0 0 0 .211.937 1.338 1.338 0 0 0 1.435.533 1.235 1.235 0 0 0 .344-.151l2.132-1.36a4.067 4.067 0 0 1 1.135-.498 4.44 4.44 0 0 1 4.765 1.766 4.108 4.108 0 0 1 .702 3.108 3.857 3.857 0 0 1-1.742 2.583l-5.589 3.562a4.072 4.072 0 0 1-1.135.499m10.358-17.95C18.484-.015 14.082-.96 10.9 1.068L5.31 4.63a6.412 6.412 0 0 0-2.896 4.295 6.753 6.753 0 0 0 .666 4.336 6.43 6.43 0 0 0-.96 2.396 6.833 6.833 0 0 0 1.168 5.167c2.229 3.19 6.63 4.135 9.812 2.108l5.59-3.562a6.41 6.41 0 0 0 2.896-4.295 6.756 6.756 0 0 0-.665-4.336 6.429 6.429 0 0 0 .958-2.396 6.831 6.831 0 0 0-1.167-5.168Z",
			docker: "M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.185.185 0 00-.185.185v1.888c0 .102.083.185.185.185m-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.185.185 0 00-.185.185v1.887c0 .102.082.185.185.186m-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.185.185 0 00-.185-.185H8.1a.185.185 0 00-.185.185v1.887c0 .102.083.185.185.186m-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.185.185 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.185.186.186m5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.185.185 0 00-.185.185v1.888c0 .102.082.185.185.185m-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.083.185.185.185m-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.186.186v1.887c0 .102.084.185.186.185m-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.185v1.888c0 .102.082.185.185.185M23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288Z"
		};
		//#endregion
		//#region src/client/file-type-icon.tsx
		const ICON_COLORS = {
			typescript: "#3178c6",
			javascript: "#f1e05a",
			python: "#3572a5",
			markdown: "#519aba",
			rust: "#dea584",
			html5: "#e34c26",
			css3: "#663399",
			go: "#00ADD8",
			php: "#4F5D95",
			ruby: "#701516",
			openjdk: "#b07219",
			kotlin: "#A97BFF",
			swift: "#F05138",
			yaml: "#cb171e",
			json: "#cbcb41",
			toml: "#9c4221",
			svelte: "#ff3e00",
			docker: "#2496ED"
		};
		const EXT_TINTS = {
			c: "#555555",
			h: "#555555",
			cpp: "#f34b7d",
			hpp: "#f34b7d",
			cc: "#f34b7d",
			cxx: "#f34b7d",
			cs: "#178600",
			vue: "#41b883",
			scss: "#c6538c",
			less: "#1d365d",
			sass: "#a53b70",
			styl: "#ff6347",
			sh: "#89e051",
			bash: "#89e051",
			zsh: "#89e051",
			ps1: "#5391fe",
			sql: "#e38c00",
			xml: "#0060ac",
			lua: "#000080",
			r: "#198ce7",
			scala: "#c22d40",
			dart: "#00b4ab",
			pl: "#0298c3",
			pm: "#0298c3",
			ex: "#6e4a7e",
			exs: "#6e4a7e",
			erl: "#b83998",
			hs: "#5e5086",
			elm: "#60b5cc",
			clj: "#db5855",
			groovy: "#4298b8",
			gradle: "#02303a",
			astro: "#ff5a03",
			ipynb: "#da5b0b",
			proto: "#8e44ad",
			txt: "#6e7781",
			log: "#6e7781",
			text: "#6e7781",
			csv: "#217346",
			tsv: "#217346",
			tex: "#3d6117",
			rtf: "#2b579a",
			pdf: "#d1242f",
			doc: "#2b579a",
			docx: "#2b579a",
			odt: "#2b579a",
			xls: "#217346",
			xlsx: "#217346",
			ods: "#217346",
			ppt: "#d24726",
			pptx: "#d24726",
			odp: "#d24726",
			png: "#8250df",
			jpg: "#8250df",
			jpeg: "#8250df",
			gif: "#8250df",
			webp: "#8250df",
			bmp: "#8250df",
			avif: "#8250df",
			svg: "#e34c26",
			tif: "#8250df",
			tiff: "#8250df",
			ico: "#8250df",
			heic: "#8250df",
			heif: "#8250df",
			zip: "#6e7781",
			tar: "#6e7781",
			gz: "#6e7781",
			tgz: "#6e7781",
			"7z": "#6e7781",
			rar: "#6e7781",
			jar: "#6e7781",
			exe: "#6e7781",
			dll: "#6e7781",
			so: "#6e7781",
			ttf: "#6e7781",
			otf: "#6e7781",
			woff: "#6e7781",
			woff2: "#6e7781",
			mp3: "#8250df",
			mp4: "#8250df",
			wav: "#8250df",
			mov: "#8250df",
			env: "#ecd53f",
			gitignore: "#f14e32",
			dockerignore: "#2496ed"
		};
		const EXT_ICONS = {
			ts: "typescript",
			tsx: "typescript",
			mts: "typescript",
			cts: "typescript",
			js: "javascript",
			jsx: "javascript",
			mjs: "javascript",
			cjs: "javascript",
			py: "python",
			pyi: "python",
			pyw: "python",
			md: "markdown",
			markdown: "markdown",
			mdown: "markdown",
			json5: "json",
			rs: "rust",
			html: "html5",
			htm: "html5",
			xhtml: "html5",
			css: "css3",
			go: "go",
			php: "php",
			rb: "ruby",
			java: "openjdk",
			kt: "kotlin",
			kts: "kotlin",
			swift: "swift",
			yml: "yaml",
			yaml: "yaml",
			json: "json",
			jsonc: "json",
			toml: "toml",
			svelte: "svelte"
		};
		function extOf(path) {
			const base = path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1);
			if (/^dockerfile(\.\w+)?$/i.test(base)) return "@dockerfile";
			const dot = base.lastIndexOf(".");
			return dot === -1 ? "" : base.slice(dot + 1).toLowerCase();
		}
		function FileSilhouette({ color }) {
			return (0, react_jsx_runtime.jsxs)("svg", {
				width: "14",
				height: "14",
				viewBox: "0 0 16 16",
				"aria-hidden": "true",
				children: [(0, react_jsx_runtime.jsx)("path", {
					d: "M4 1.5h5.2L12.5 4.8v9.7a1 1 0 0 1-1 1h-7.5a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z",
					fill: color
				}), (0, react_jsx_runtime.jsx)("path", {
					d: "M9.2 1.5v3.3h3.3",
					fill: "none",
					stroke: "currentColor",
					strokeOpacity: "0.35",
					strokeWidth: "1"
				})]
			});
		}
		function FileTypeIcon({ path }) {
			const ext = extOf(path);
			const icon = ext === "@dockerfile" ? "docker" : EXT_ICONS[ext];
			const d = icon === void 0 ? void 0 : LOGO_PATHS[icon];
			if (icon !== void 0 && d !== void 0) return (0, react_jsx_runtime.jsx)("svg", {
				width: "14",
				height: "14",
				viewBox: ICON_VIEWBOX,
				"aria-hidden": "true",
				children: (0, react_jsx_runtime.jsx)("path", {
					d,
					fill: ICON_COLORS[icon] ?? "var(--dsw-alias-label-tertiary)"
				})
			});
			return (0, react_jsx_runtime.jsx)(FileSilhouette, { color: EXT_TINTS[ext] ?? "var(--dsw-alias-label-tertiary)" });
		}
		//#endregion
		//#region src/client/file-pane.tsx
		function highlightedLine(text, engine, tokens) {
			const render = (chunk, offset) => {
				if (tokens === null || tokens.length === 0) return chunk;
				return splitLineByTokens(chunk, sliceTokens(tokens, offset, offset + chunk.length)).map((seg, index) => {
					const inner = chunk.slice(seg.start, seg.end);
					if (seg.kind === null) return (0, react_jsx_runtime.jsx)("span", { children: inner }, index);
					const cls = seg.kind === "kw" ? review_module_css_default.tokKw : seg.kind === "str" ? review_module_css_default.tokStr : seg.kind === "num" ? review_module_css_default.tokNum : review_module_css_default.tokCom;
					return (0, react_jsx_runtime.jsx)("span", {
						className: cls,
						children: inner
					}, index);
				});
			};
			const parts = engine.parts(text);
			if (parts.length === 1) return render(parts[0], 0);
			let offset = 0;
			return parts.map((part, index) => {
				const at = offset;
				offset += part.length;
				return index % 2 === 1 ? (0, react_jsx_runtime.jsx)("mark", {
					className: review_module_css_default.matchMark,
					children: part
				}, index) : render(part, at);
			});
		}
		function ViewSwitch({ active, onViewChange, allowFileView = true, t }) {
			const options = [
				{
					key: "split",
					icon: (0, react_jsx_runtime.jsx)(LineLeftIcon, {}),
					label: t("view.split"),
					fileOnly: false
				},
				{
					key: "unified",
					icon: (0, react_jsx_runtime.jsx)(LinesIcon, {}),
					label: t("view.unified"),
					fileOnly: false
				},
				{
					key: "file",
					icon: (0, react_jsx_runtime.jsx)(FileIcon, {}),
					label: t("view.file"),
					fileOnly: true
				}
			].filter((option) => allowFileView || !option.fileOnly);
			return (0, react_jsx_runtime.jsx)("span", {
				className: review_module_css_default.scopeSwitch,
				role: "group",
				"aria-label": t("view.label"),
				children: options.map((candidate) => (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: review_module_css_default.scopeBtn + (active === candidate.key ? " " + review_module_css_default.scopeBtnActive : ""),
					onClick: () => {
						onViewChange(candidate.key);
					},
					title: candidate.label,
					children: [candidate.icon, (0, react_jsx_runtime.jsx)("span", { children: candidate.label })]
				}, candidate.key))
			});
		}
		function FilePane({ file, search, content, truncated, binary, size, loading, canShowDiff, view, onViewChange, syntaxHighlight, blameOn, onToggleBlame, blameState, previewAvailable, onShowPreview, t }) {
			const engine = (0, react.useMemo)(() => makeSearchEngine(search), [search]);
			const highlighter = (0, react.useMemo)(() => syntaxHighlight ? makeLineHighlighter(file.path) : null, [
				file.path,
				syntaxHighlight,
				content
			]);
			const lines = (0, react.useMemo)(() => {
				if (content === "") return [];
				const rows = content.split("\n");
				if (rows[rows.length - 1] === "") rows.pop();
				return rows;
			}, [content]);
			const capped = !loading && !binary && lines.length > 2e4;
			const visible = capped ? lines.slice(0, MAX_RENDER_ROWS) : lines;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.diffPane,
				"data-git-review-diff": "",
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.diffHeader,
						children: [
							(0, react_jsx_runtime.jsx)(FileTypeIcon, { path: file.path }),
							(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.diffPath,
								children: file.path
							}),
							(0, react_jsx_runtime.jsx)("span", { className: review_module_css_default.diffHeaderSpacer }),
							canShowDiff && (0, react_jsx_runtime.jsx)(ViewSwitch, {
								active: view,
								onViewChange,
								t
							}),
							previewAvailable === true && onShowPreview !== void 0 && (0, react_jsx_runtime.jsxs)("span", {
								className: review_module_css_default.scopeSwitch,
								role: "group",
								"aria-label": t("preview.toggle"),
								children: [(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: review_module_css_default.scopeBtn,
									onClick: onShowPreview,
									children: t("preview.toggle")
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: review_module_css_default.scopeBtn + " " + review_module_css_default.scopeBtnActive,
									disabled: true,
									"aria-current": "true",
									children: t("preview.source")
								})]
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.toolBtn + (blameOn ? " " + review_module_css_default.toolBtnActive : ""),
								"aria-pressed": blameOn,
								title: t("blame.hint"),
								onClick: onToggleBlame,
								children: (0, react_jsx_runtime.jsx)("span", { children: t("blame.toggle") })
							})
						]
					}),
					binary ? (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.noticeRow,
						children: (size > 0 ? t("diff.binarySize", { size }) : t("diff.binary")) + (previewAvailable === true ? " · " + t("preview.openHint") : "")
					}) : null,
					!binary && truncated && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.noticeRow,
						children: t("file.truncated")
					}),
					blameOn && blameState.kind === "loading" && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.noticeRow,
						children: t("blame.loading")
					}),
					blameOn && blameState.kind === "failed" && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.noticeRow + " " + review_module_css_default.noticeError,
						children: blameState.message ?? ""
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.diffScroll,
						children: [
							loading && (0, react_jsx_runtime.jsx)("div", {
								className: review_module_css_default.paneNotice,
								children: t("file.loading")
							}),
							!loading && !binary && lines.length === 0 && (0, react_jsx_runtime.jsx)("div", {
								className: review_module_css_default.paneNotice,
								children: t("file.empty")
							}),
							!loading && !binary && visible.map((line, index) => (0, react_jsx_runtime.jsxs)("div", {
								className: review_module_css_default.fileRowGrid + (blameOn && blameState.kind === "ready" && blameState.lines !== null ? " " + review_module_css_default.fileRowGridBlame : ""),
								children: [
									blameOn && blameState.kind === "ready" && blameState.lines !== null && (() => {
										const row = blameState.lines[index] ?? null;
										if (row === null) return (0, react_jsx_runtime.jsx)("span", { className: review_module_css_default.blameGutter });
										const previous = index > 0 ? blameState.lines[index - 1] ?? null : null;
										const repeated = previous !== null && previous.hash === row.hash;
										const short = row.hash.slice(0, 7);
										const authorChars = Array.from(row.author);
										const author = authorChars.length > 10 ? authorChars.slice(0, 9).join("") + "…" : row.author;
										return (0, react_jsx_runtime.jsx)("span", {
											className: review_module_css_default.blameGutter,
											title: repeated ? void 0 : row.author + " · " + row.hash + " · " + row.summary,
											children: repeated ? "" : author + " " + short
										});
									})(),
									(0, react_jsx_runtime.jsx)("span", {
										className: review_module_css_default.fileNo,
										children: index + 1
									}),
									(0, react_jsx_runtime.jsx)("span", {
										className: review_module_css_default.cellText,
										children: highlightedLine(line, engine, highlighter?.line(line) ?? null)
									})
								]
							}, index)),
							capped && (0, react_jsx_runtime.jsx)("div", {
								className: review_module_css_default.noticeRow,
								children: t("diff.renderCapped", { count: 2e4 })
							}),
							(0, react_jsx_runtime.jsx)("div", { className: review_module_css_default.diffBottomReserve })
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/diff-pane.tsx
		function searchParts(text, engine) {
			const parts = engine.parts(text);
			if (parts.length === 1) return parts[0];
			return parts.map((part, index) => index % 2 === 1 ? (0, react_jsx_runtime.jsx)("mark", {
				className: review_module_css_default.matchMark,
				children: part
			}, index) : part);
		}
		function tokenClass(kind) {
			return kind === "kw" ? review_module_css_default.tokKw : kind === "str" ? review_module_css_default.tokStr : kind === "num" ? review_module_css_default.tokNum : review_module_css_default.tokCom;
		}
		function renderTokens(text, engine, tokens) {
			if (tokens === null || tokens.length === 0) return searchParts(text, engine);
			return splitLineByTokens(text, tokens).map((seg, index) => {
				const inner = searchParts(text.slice(seg.start, seg.end), engine);
				return seg.kind === null ? (0, react_jsx_runtime.jsx)("span", { children: inner }, index) : (0, react_jsx_runtime.jsx)("span", {
					className: tokenClass(seg.kind),
					children: inner
				}, index);
			});
		}
		function renderCellText(cell, engine, spans, changedClass, tokens) {
			if (cell === null) return "";
			const text = cell.text;
			if (spans === null || spans.length === 0) return renderTokens(text, engine, tokens);
			const nodes = [];
			let cursor = 0;
			for (const [start, end] of spans) {
				if (start > cursor) nodes.push(renderTokens(text.slice(cursor, start), engine, sliceTokens(tokens, cursor, start)));
				if (end > start) nodes.push((0, react_jsx_runtime.jsx)("span", {
					className: changedClass,
					children: searchParts(text.slice(start, end), engine)
				}, start));
				cursor = Math.max(cursor, end);
			}
			if (cursor < text.length) nodes.push(renderTokens(text.slice(cursor), engine, sliceTokens(tokens, cursor, text.length)));
			return nodes;
		}
		function UnifiedRow({ line, engine, words, highlighter, ordinal, active, commentTitle, onComment }) {
			const kindClass = line.kind === "ctx" ? review_module_css_default.rowUCtx : line.kind === "del" ? review_module_css_default.rowUDel : review_module_css_default.rowUAdd;
			const regions = line.kind === "ctx" ? null : words.pair(line.pair);
			const spans = regions === null ? null : line.kind === "del" ? regions.old : regions.new;
			const changedClass = line.kind === "del" ? review_module_css_default.wordDel : review_module_css_default.wordAdd;
			const matched = ordinal !== void 0;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.rowU + " " + kindClass + (matched && active ? " " + review_module_css_default.rowMatchActive : ""),
				"data-diff-match": matched ? "" : void 0,
				children: [
					(0, react_jsx_runtime.jsxs)("span", {
						className: review_module_css_default.cellNoU + (line.kind !== "ctx" ? " " + review_module_css_default.cellNoUSign : ""),
						children: [
							line.kind === "del" ? "−" : line.kind === "add" ? "+" : "",
							" ",
							line.no
						]
					}),
					(0, react_jsx_runtime.jsxs)("span", {
						className: review_module_css_default.cellText,
						children: [renderCellText({
							no: line.no,
							text: line.text,
							noNewline: line.noNewline
						}, engine, spans, changedClass, highlighter?.line(line.text) ?? null), line.noNewline === true && (0, react_jsx_runtime.jsx)("em", {
							className: review_module_css_default.noNewline,
							children: "↩"
						})]
					}),
					onComment !== void 0 && (line.kind === "ctx" || line.kind === "add") && line.pair.right !== null && (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: review_module_css_default.rowCommentBtn,
						title: commentTitle,
						"aria-label": commentTitle,
						onClick: () => {
							onComment(line.pair.right.no);
						},
						children: (0, react_jsx_runtime.jsx)(CommentIcon, {})
					})
				]
			});
		}
		function Row({ row, engine, words, highlighter, matchOrdinal, active, commentTitle, onComment }) {
			const kindClass = row.kind === "ctx" ? review_module_css_default.row : row.kind === "del" ? review_module_css_default.rowDel : row.kind === "add" ? review_module_css_default.rowAdd : review_module_css_default.rowPair;
			const regions = words.pair(row);
			const matched = matchOrdinal !== void 0;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.row + " " + kindClass + (matched && active ? " " + review_module_css_default.rowMatchActive : ""),
				"data-diff-match": matched ? "" : void 0,
				children: [
					(0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.cellNo + (row.left === null ? " " + review_module_css_default.cellHatched : ""),
						children: row.left?.no ?? ""
					}),
					(0, react_jsx_runtime.jsxs)("span", {
						className: review_module_css_default.cellText + (row.left === null ? " " + review_module_css_default.cellHatched : ""),
						children: [renderCellText(row.left, engine, regions?.old ?? null, review_module_css_default.wordDel, row.left === null ? null : highlighter?.line(row.left.text) ?? null), row.left?.noNewline === true && (0, react_jsx_runtime.jsx)("em", {
							className: review_module_css_default.noNewline,
							children: "↩"
						})]
					}),
					(0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.cellNo + (row.right === null ? " " + review_module_css_default.cellHatched : ""),
						children: row.right?.no ?? ""
					}),
					(0, react_jsx_runtime.jsxs)("span", {
						className: review_module_css_default.cellText + (row.right === null ? " " + review_module_css_default.cellHatched : ""),
						children: [renderCellText(row.right, engine, regions?.new ?? null, review_module_css_default.wordAdd, row.right === null ? null : highlighter?.line(row.right.text) ?? null), row.right?.noNewline === true && (0, react_jsx_runtime.jsx)("em", {
							className: review_module_css_default.noNewline,
							children: "↩"
						})]
					}),
					onComment !== void 0 && row.right !== null && (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: review_module_css_default.rowCommentBtn,
						title: commentTitle,
						"aria-label": commentTitle,
						onClick: () => {
							onComment(row.right.no);
						},
						children: (0, react_jsx_runtime.jsx)(CommentIcon, {})
					})
				]
			});
		}
		function CommentEditor({ path, line, useInput, inputActions, onDraftAdd, onClose, t }) {
			const [text, setText] = (0, react.useState)("");
			const draft = useInput((s) => s.draft);
			const comment = path + ":" + line + " — " + text.trim();
			const write = () => {
				const current = draft.replace(/\s+$/, "");
				inputActions.setDraft(current === "" ? comment : current + "\n\n" + comment);
				onClose();
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.commentEditor,
				children: [(0, react_jsx_runtime.jsx)("textarea", {
					className: review_module_css_default.commentTextarea,
					value: text,
					onChange: (event) => {
						setText(event.target.value);
					},
					onKeyDown: (event) => {
						if (event.key === "Escape") onClose();
					},
					placeholder: t("comment.placeholder"),
					rows: 2,
					autoFocus: true
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: review_module_css_default.commentActions,
					children: [
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: review_module_css_default.commitBtn,
							disabled: text.trim() === "",
							onClick: write,
							children: t("comment.write")
						}),
						onDraftAdd !== void 0 && (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: review_module_css_default.commitBtn,
							disabled: text.trim() === "",
							onClick: () => {
								onDraftAdd({
									path,
									line,
									text: text.trim()
								});
								onClose();
							},
							children: t("comment.saveDraft")
						}),
						(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: review_module_css_default.commitBtn,
							onClick: onClose,
							children: t("comment.cancel")
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.commentLine,
							children: path + ":" + line
						})
					]
				})]
			});
		}
		function DiffPane({ file, diff, truncated, loading, binary, size, full, onToggleFull, scope, onScopeChange, view, onViewChange, showViewSwitch = true, allowFileView = true, wsIgnore, onToggleWs, syntaxHighlight, search, baseActive, useInput, inputActions, onDraftAdd, hunkOps, onHunkOp, hunkBusy, hunkNotice, onFileHistory, historyLoading, t }) {
			const parsed = (0, react.useMemo)(() => parseUnifiedDiff(diff), [diff]);
			const showBinary = binary || parsed.binary;
			const notice = showBinary ? size > 0 ? t("diff.binarySize", { size }) : t("diff.binary") : truncated ? t("diff.truncated") : null;
			const engine = (0, react.useMemo)(() => makeSearchEngine(search), [search]);
			const words = (0, react.useMemo)(() => makeWordHighlighter(), [parsed]);
			const highlighter = (0, react.useMemo)(() => syntaxHighlight ? makeLineHighlighter(file.path) : null, [
				file.path,
				syntaxHighlight,
				parsed
			]);
			const unified = view === "unified";
			const scrollRef = (0, react.useRef)(null);
			const [activeMatch, setActiveMatch] = (0, react.useState)(0);
			const matchRowCount = (0, react.useMemo)(() => unified ? countUnifiedMatches(parsed, engine) : countMatchRows(parsed, engine), [
				parsed,
				engine,
				unified
			]);
			(0, react.useEffect)(() => {
				setActiveMatch(0);
			}, [
				search,
				file.path,
				unified
			]);
			const shownMatch = matchRowCount === 0 ? 0 : Math.min(activeMatch, matchRowCount - 1);
			(0, react.useEffect)(() => {
				if (!engine.active || matchRowCount === 0) return;
				(scrollRef.current?.querySelectorAll("[data-diff-match]"))?.[shownMatch]?.scrollIntoView({ block: "center" });
			}, [
				shownMatch,
				engine,
				matchRowCount
			]);
			const gotoMatch = (0, react.useCallback)((delta) => {
				setActiveMatch((previous) => {
					if (matchRowCount === 0) return 0;
					return ((previous + delta) % matchRowCount + matchRowCount) % matchRowCount;
				});
			}, [matchRowCount]);
			const [commentTarget, setCommentTarget] = (0, react.useState)(null);
			const [armedHunk, setArmedHunk] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				setArmedHunk(null);
			}, [
				file.path,
				scope,
				hunkOps,
				diff,
				full
			]);
			(0, react.useEffect)(() => {
				setCommentTarget(null);
			}, [file.path, diff]);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.diffPane,
				"data-git-review-diff": "",
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.diffHeader,
						children: [
							(0, react_jsx_runtime.jsx)(FileTypeIcon, { path: file.path }),
							(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.diffPath,
								children: file.path
							}),
							file.untracked && (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.chip,
								children: t("badge.untracked")
							}),
							parsed.newFile && (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.chip,
								children: t("diff.newFile")
							}),
							parsed.deletedFile && (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.chip,
								children: t("diff.deletedFile")
							}),
							file.origPath !== void 0 && (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.diffRename,
								children: t("diff.renamedFrom", { path: file.origPath })
							}),
							(0, react_jsx_runtime.jsx)("span", { className: review_module_css_default.diffHeaderSpacer }),
							matchRowCount > 0 && (0, react_jsx_runtime.jsxs)("span", {
								className: review_module_css_default.matchNav,
								children: [
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: review_module_css_default.toolBtn,
										onClick: () => {
											gotoMatch(-1);
										},
										title: t("search.prev"),
										"aria-label": t("search.prev"),
										children: "‹"
									}),
									(0, react_jsx_runtime.jsx)("span", {
										className: review_module_css_default.matchCount,
										children: shownMatch + 1 + " / " + matchRowCount
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: review_module_css_default.toolBtn,
										onClick: () => {
											gotoMatch(1);
										},
										title: t("search.next"),
										"aria-label": t("search.next"),
										children: "›"
									})
								]
							}),
							showViewSwitch && (0, react_jsx_runtime.jsx)(ViewSwitch, {
								active: view,
								onViewChange,
								allowFileView,
								t
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.toolBtn + (wsIgnore ? " " + review_module_css_default.toolBtnActive : ""),
								"aria-pressed": wsIgnore,
								onClick: onToggleWs,
								title: t("diff.wsHint"),
								children: (0, react_jsx_runtime.jsx)("span", { children: t("diff.ws") })
							}),
							!file.untracked && !baseActive && (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.scopeSwitch,
								role: "group",
								"aria-label": t("scope.label"),
								children: [
									"all",
									"staged",
									"unstaged"
								].map((candidate) => (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: review_module_css_default.scopeBtn + (scope === candidate ? " " + review_module_css_default.scopeBtnActive : ""),
									onClick: () => {
										onScopeChange(candidate);
									},
									children: t("scope." + candidate)
								}, candidate))
							}),
							onFileHistory !== void 0 && !baseActive && (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.toolBtn,
								disabled: historyLoading === true,
								title: t("history.hint"),
								onClick: (event) => {
									const rect = event.currentTarget.getBoundingClientRect();
									onFileHistory(file.path, Math.round(rect.right), Math.round(rect.bottom + 6));
								},
								children: [(0, react_jsx_runtime.jsx)(HistoryIcon, {}), (0, react_jsx_runtime.jsx)("span", { children: t("history.toggle") })]
							}),
							(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: review_module_css_default.toolBtn,
								onClick: onToggleFull,
								title: full ? t("collapseAll") : t("expandAll"),
								children: [full ? (0, react_jsx_runtime.jsx)(CollapseIcon, {}) : (0, react_jsx_runtime.jsx)(ExpandIcon, {}), (0, react_jsx_runtime.jsx)("span", { children: full ? t("collapseAll") : t("expandAll") })]
							})
						]
					}),
					notice !== null && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.noticeRow,
						children: notice
					}),
					hunkNotice != null && hunkNotice !== "" && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.noticeRow + " " + review_module_css_default.noticeError,
						children: hunkNotice
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.diffScroll,
						ref: scrollRef,
						children: [
							loading && (0, react_jsx_runtime.jsx)("div", {
								className: review_module_css_default.paneNotice,
								children: t("diff.loading")
							}),
							!loading && !showBinary && parsed.hunks.length === 0 && (0, react_jsx_runtime.jsx)("div", {
								className: review_module_css_default.paneNotice,
								children: t("diff.noTextChanges")
							}),
							!loading && renderHunks(parsed, {
								full,
								onToggleFull,
								t,
								engine,
								words,
								highlighter,
								unified,
								activeMatch,
								file,
								commentTarget,
								onCommentStart: useInput !== void 0 && inputActions !== void 0 ? (hi, ri, line) => {
									setCommentTarget({
										hi,
										ri,
										line
									});
								} : void 0,
								onCommentClose: () => {
									setCommentTarget(null);
								},
								useInput,
								inputActions,
								onDraftAdd,
								hunkOps,
								onHunkOp,
								hunkBusy: hunkBusy === true,
								armedHunk,
								onRevertArm: (hi) => {
									setArmedHunk((current) => current === hi ? null : hi);
								}
							}),
							(0, react_jsx_runtime.jsx)("div", { className: review_module_css_default.diffBottomReserve })
						]
					})
				]
			});
		}
		function renderHunks(parsed, ui) {
			let budget = MAX_RENDER_ROWS;
			let cut = false;
			let matchCounter = 0;
			const out = [];
			parsed.hunks.forEach((hunk, hi) => {
				if (budget <= 0) {
					cut = true;
					return;
				}
				const previous = parsed.hunks[hi - 1];
				const skipped = previous === void 0 ? 0 : Math.max(0, hunk.oldStart - (previous.oldStart + previous.oldCount), hunk.newStart - (previous.newStart + previous.newCount));
				const rows = hunk.rows.slice(0, budget);
				if (rows.length < hunk.rows.length) cut = true;
				budget -= rows.length;
				out.push((0, react_jsx_runtime.jsxs)(react.Fragment, { children: [
					skipped > 0 && !ui.full && (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: review_module_css_default.gapBar,
						onClick: ui.onToggleFull,
						title: ui.t("diff.expandHint"),
						children: "⋯ " + ui.t("diff.unmodifiedLines", { count: skipped }) + " ⋯"
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.hunkHeader,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.hunkHeaderText,
							children: "@@ -" + hunk.oldStart + "," + hunk.oldCount + " +" + hunk.newStart + "," + hunk.newCount + " @@" + (hunk.section === "" ? "" : " " + hunk.section)
						}), ui.hunkOps !== void 0 && ui.onHunkOp !== void 0 && (0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.hunkActions,
							children: ui.hunkOps === "unstage" ? (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.hunkOpBtn,
								disabled: ui.hunkBusy,
								title: ui.t("hunk.unstageHint"),
								onClick: () => {
									ui.onHunkOp("unstage", hi);
								},
								children: ui.t("hunk.unstage")
							}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.hunkOpBtn,
								disabled: ui.hunkBusy,
								title: ui.t("hunk.stageHint"),
								onClick: () => {
									ui.onHunkOp("stage", hi);
								},
								children: ui.t("hunk.stage")
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.hunkOpBtn + " " + review_module_css_default.hunkOpDanger + (ui.armedHunk === hi ? " " + review_module_css_default.hunkOpArmed : ""),
								disabled: ui.hunkBusy,
								title: ui.t("hunk.revertHint"),
								onClick: () => {
									if (ui.armedHunk === hi) {
										ui.onHunkOp("revert", hi);
										ui.onRevertArm(hi);
									} else ui.onRevertArm(hi);
								},
								children: ui.armedHunk === hi ? ui.t("hunk.revertConfirm") : ui.t("hunk.revert")
							})] })
						})]
					}),
					ui.unified ? unifyHunkRows(rows).map((line, li) => {
						const ordinal = ui.engine.test(line.text) ? matchCounter++ : void 0;
						return (0, react_jsx_runtime.jsxs)(react.Fragment, { children: [(0, react_jsx_runtime.jsx)(UnifiedRow, {
							line,
							engine: ui.engine,
							words: ui.words,
							highlighter: ui.highlighter,
							ordinal,
							active: ordinal === ui.activeMatch,
							commentTitle: ui.t("comment.add"),
							onComment: ui.onCommentStart !== void 0 && line.pair.right !== null ? (num) => {
								ui.onCommentStart(hi, li, num);
							} : void 0
						}), ui.commentTarget !== null && ui.commentTarget.hi === hi && ui.commentTarget.ri === li && ui.useInput !== void 0 && ui.inputActions !== void 0 && (0, react_jsx_runtime.jsx)(CommentEditor, {
							path: ui.file.path,
							line: ui.commentTarget.line,
							useInput: ui.useInput,
							inputActions: ui.inputActions,
							onDraftAdd: ui.onDraftAdd,
							onClose: ui.onCommentClose,
							t: ui.t
						})] }, li);
					}) : rows.map((row, ri) => {
						const ordinal = rowHasMatch(row, ui.engine) ? matchCounter++ : void 0;
						return (0, react_jsx_runtime.jsxs)(react.Fragment, { children: [(0, react_jsx_runtime.jsx)(Row, {
							row,
							engine: ui.engine,
							words: ui.words,
							highlighter: ui.highlighter,
							matchOrdinal: ordinal,
							active: ordinal === ui.activeMatch,
							commentTitle: ui.t("comment.add"),
							onComment: ui.onCommentStart !== void 0 && row.right !== null ? (line) => {
								ui.onCommentStart(hi, ri, line);
							} : void 0
						}), ui.commentTarget !== null && ui.commentTarget.hi === hi && ui.commentTarget.ri === ri && ui.useInput !== void 0 && ui.inputActions !== void 0 && (0, react_jsx_runtime.jsx)(CommentEditor, {
							path: ui.file.path,
							line: ui.commentTarget.line,
							useInput: ui.useInput,
							inputActions: ui.inputActions,
							onDraftAdd: ui.onDraftAdd,
							onClose: ui.onCommentClose,
							t: ui.t
						})] }, ri);
					})
				] }, hi));
			});
			if (cut) out.push((0, react_jsx_runtime.jsx)("div", {
				className: review_module_css_default.noticeRow,
				children: ui.t("diff.renderCapped", { count: MAX_RENDER_ROWS })
			}, "capped"));
			return out;
		}
		//#endregion
		//#region src/client/preview-pane.tsx
		const ZOOM_LEVELS = [
			.25,
			.5,
			.75,
			1,
			1.5,
			2,
			3,
			4,
			6,
			8
		];
		function stepZoom(current, dir) {
			let at = 0;
			while (at < ZOOM_LEVELS.length - 1 && ZOOM_LEVELS[at] < current) at += 1;
			if (dir > 0) return ZOOM_LEVELS[Math.min(at + (ZOOM_LEVELS[at] > current ? 0 : 1), ZOOM_LEVELS.length - 1)];
			return ZOOM_LEVELS[Math.max(at - (ZOOM_LEVELS[at] < current ? 0 : 1), 0)];
		}
		let cachedMarkdown;
		function markdownRenderer() {
			if (cachedMarkdown !== void 0) return cachedMarkdown;
			try {
				cachedMarkdown = require("@deepseek-ai/dsh-client-ui-primitives").MarkdownText ?? null;
			} catch {
				cachedMarkdown = null;
			}
			return cachedMarkdown;
		}
		function PreviewPane({ file, kind, text, textLoading, textTruncated = false, dataUrl, bytesFailed, bytesTruncated, onShowSource, t }) {
			const labels = (0, react.useMemo)(() => ({
				code: {
					copyLabel: t("preview.copy"),
					copiedLabel: t("preview.copied")
				},
				footnotes: t("preview.footnotes")
			}), [t]);
			const Markdown = kind === "markdown" ? markdownRenderer() : null;
			const [zoom, setZoom] = (0, react.useState)("fit");
			const [natW, setNatW] = (0, react.useState)(0);
			const scrollRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				setZoom("fit");
				setNatW(0);
			}, [file.path]);
			const fittedRatio = () => {
				const el = scrollRef.current;
				if (natW <= 0 || el === null || el.clientWidth <= 0) return 1;
				return Math.min(1, el.clientWidth / natW);
			};
			const step = (dir) => {
				setZoom((current) => stepZoom(current === "fit" ? fittedRatio() : current, dir));
			};
			(0, react.useEffect)(() => {
				const el = scrollRef.current;
				if (el === null || kind !== "image") return;
				const onWheel = (event) => {
					if (!event.ctrlKey && !event.metaKey) return;
					event.preventDefault();
					const dir = event.deltaY < 0 ? 1 : -1;
					setZoom((current) => stepZoom(current === "fit" ? fittedRatio() : current, dir));
				};
				el.addEventListener("wheel", onWheel, { passive: false });
				return () => {
					el.removeEventListener("wheel", onWheel);
				};
			}, [kind, natW]);
			const zoomLabel = zoom === "fit" ? t("preview.zoomFit") : String(Math.round(zoom * 100)) + "%";
			const commitZoom = (input) => {
				const value = Number(input.value.replace("%", "").trim()) / 100;
				if (!Number.isFinite(value) || value < .1 || value > 8) {
					input.value = zoomLabel;
					return;
				}
				setZoom(value);
			};
			const imageReady = kind === "image" && dataUrl !== null && !bytesTruncated;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.diffPane,
				"data-git-review-diff": "",
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: review_module_css_default.diffHeader,
					children: [
						(0, react_jsx_runtime.jsx)(FileTypeIcon, { path: file.path }),
						(0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.diffPath,
							children: file.path
						}),
						(0, react_jsx_runtime.jsx)("span", { className: review_module_css_default.diffHeaderSpacer }),
						imageReady && (0, react_jsx_runtime.jsxs)("span", {
							className: review_module_css_default.zoomGroup,
							role: "group",
							"aria-label": t("preview.zoomHint"),
							children: [
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: review_module_css_default.zoomBtn,
									title: t("preview.zoomOut"),
									"aria-label": t("preview.zoomOut"),
									onClick: () => {
										step(-1);
									},
									children: "−"
								}),
								(0, react_jsx_runtime.jsx)("input", {
									className: review_module_css_default.zoomInput,
									defaultValue: zoomLabel,
									title: t("preview.zoomHint"),
									"aria-label": t("preview.zoomHint"),
									spellCheck: false,
									onKeyDown: (event) => {
										if (event.key === "Enter") commitZoom(event.currentTarget);
									},
									onBlur: (event) => {
										commitZoom(event.currentTarget);
									}
								}, zoomLabel),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: review_module_css_default.zoomBtn,
									title: t("preview.zoomIn"),
									"aria-label": t("preview.zoomIn"),
									onClick: () => {
										step(1);
									},
									children: "+"
								})
							]
						}),
						(0, react_jsx_runtime.jsxs)("span", {
							className: review_module_css_default.scopeSwitch,
							role: "group",
							"aria-label": t("preview.toggle"),
							children: [(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.scopeBtn + " " + review_module_css_default.scopeBtnActive,
								children: t("preview.toggle")
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.scopeBtn,
								onClick: onShowSource,
								children: t("preview.source")
							})]
						})
					]
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: review_module_css_default.previewScroll,
					ref: scrollRef,
					children: [
						kind === "markdown" && (textLoading ? (0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.paneNotice,
							children: t("file.loading")
						}) : Markdown !== null ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.previewMd,
							children: (0, react_jsx_runtime.jsx)(Markdown, {
								text,
								labels
							})
						}), textTruncated && (0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.noticeRow,
							children: t("file.truncated")
						})] }) : (0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.paneNotice,
							children: t("preview.loadFailed")
						})),
						kind === "image" && (imageReady ? (0, react_jsx_runtime.jsx)("img", {
							className: review_module_css_default.previewImg,
							style: zoom === "fit" ? void 0 : {
								width: Math.max(1, Math.round(natW * zoom)),
								maxWidth: "none"
							},
							src: dataUrl,
							alt: file.path,
							title: t("preview.zoomHint"),
							onLoad: (event) => {
								setNatW(event.currentTarget.naturalWidth);
							},
							onDoubleClick: () => {
								setZoom((current) => current === "fit" ? 1 : "fit");
							}
						}) : (0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.paneNotice,
							children: bytesFailed ? t("preview.loadFailed") : bytesTruncated ? t("preview.tooLarge") : t(textLoading ? "file.loading" : "preview.loading")
						})),
						kind === "pdf" && (dataUrl !== null && !bytesTruncated ? (0, react_jsx_runtime.jsx)("iframe", {
							className: review_module_css_default.previewPdf,
							src: dataUrl,
							sandbox: "",
							title: file.path
						}) : (0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.paneNotice,
							children: bytesFailed ? t("preview.loadFailed") : bytesTruncated ? t("preview.tooLarge") : t("preview.loading")
						})),
						kind === "html" && (textLoading ? (0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.paneNotice,
							children: t("file.loading")
						}) : (0, react_jsx_runtime.jsx)("iframe", {
							className: review_module_css_default.previewPdf,
							srcDoc: text,
							sandbox: "",
							title: file.path
						})),
						(0, react_jsx_runtime.jsx)("div", { className: review_module_css_default.diffBottomReserve })
					]
				})]
			});
		}
		//#endregion
		//#region src/client/preview-kind.ts
		function previewKindForPath(path) {
			const lower = path.toLowerCase();
			if (/\.(md|markdown|mdown|mkd|mdx|rmd)$/.test(lower)) return "markdown";
			if (/\.(png|jpe?g|gif|webp|bmp|avif|svg|ico)$/.test(lower)) return "image";
			if (/\.pdf$/.test(lower)) return "pdf";
			if (/\.(html?|xhtml)$/.test(lower)) return "html";
			return null;
		}
		//#endregion
		//#region src/client/md-preview.ts
		function attr(tag, name) {
			const hit = new RegExp(name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')", "i").exec(tag);
			if (hit === null) return null;
			return hit[1] ?? hit[2] ?? null;
		}
		function htmlFallbackForPreview(text) {
			return text.replace(/^[ \t]*<picture[^>]*>[ \t]*$/gim, "").replace(/^[ \t]*<\/picture>[ \t]*$/gim, "").replace(/^[ \t]*<source[^>]*\/?>[ \t]*$/gim, "").replace(/<picture[^>]*>/gi, "").replace(/<\/picture>/gi, "").replace(/<source[^>]*\/?>/gi, "").replace(/^[ \t]*<img\b[^>]*\/?>/gim, (tag) => {
				const src = attr(tag.trim(), "src") ?? "";
				return src === "" ? "" : "![" + (attr(tag, "alt") ?? "") + "](" + src + ")";
			}).replace(/<img\b[^>]*\/?>/gi, (tag) => {
				const src = attr(tag, "src") ?? "";
				return src === "" ? "" : "![" + (attr(tag, "alt") ?? "") + "](" + src + ")";
			}).replace(/^[ \t]*<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gim, (_whole, dbl, sqt, text) => "[" + text + "](" + (dbl ?? sqt ?? "") + ")").replace(/<a\b[^>]*href\s*=\s*(?:"([^"]*)"|'([^']*)')[^>]*>([\s\S]*?)<\/a>/gi, (_whole, dbl, sqt, text) => "[" + text + "](" + (dbl ?? sqt ?? "") + ")").replace(/<\/?p\b[^>]*>/gi, "\n\n");
		}
		const INLINE_IMG = /!\[([^\]]*)\]\(\s*<?([^\s)>]+)>?((?:\s+["'][^"']*["'])?\s*)\)/g;
		const REF_USE = /!\[[^\]]*\]\[([^\]]*)\]/g;
		const REF_DEF = /^( {0,3}\[[^\]]+\]:\s*<?)([^\s>]+)(>?.*)$/gm;
		function collectMdAssets(text) {
			const out = [];
			const seen = new Set();
			const take = (url) => {
				if (!seen.has(url)) {
					seen.add(url);
					out.push(url);
				}
			};
			INLINE_IMG.lastIndex = 0;
			for (let hit = INLINE_IMG.exec(text); hit !== null; hit = INLINE_IMG.exec(text)) take(hit[2]);
			const usedIds = new Set();
			REF_USE.lastIndex = 0;
			for (let hit = REF_USE.exec(text); hit !== null; hit = REF_USE.exec(text)) usedIds.add(hit[1]);
			if (usedIds.size > 0) {
				REF_DEF.lastIndex = 0;
				for (let hit = REF_DEF.exec(text); hit !== null; hit = REF_DEF.exec(text)) {
					const idHit = /^ {0,3}\[([^\]]+)\]/.exec(hit[0]);
					if (idHit !== null && usedIds.has(idHit[1])) take(hit[2]);
				}
			}
			return out;
		}
		function rewriteMdAssets(text, table) {
			INLINE_IMG.lastIndex = 0;
			const inline = text.replace(INLINE_IMG, (_whole, alt, url, title) => "![" + alt + "](" + (table.get(url) ?? url) + title + ")");
			REF_DEF.lastIndex = 0;
			return inline.replace(REF_DEF, (_whole, head, url, tail) => head + (table.get(url) ?? url) + tail);
		}
		function dirOf(path) {
			const slash = path.lastIndexOf("/");
			return slash === -1 ? "" : path.slice(0, slash);
		}
		function resolveMdAsset(mdPath, url) {
			if (/^(?:[a-zA-Z][a-zA-Z0-9+.-]*:|data:|#)/.test(url)) return null;
			const clean = url.split("#")[0].split("?")[0];
			if (clean === "") return null;
			const base = clean.startsWith("/") ? "" : dirOf(mdPath);
			const parts = [];
			for (const seg of (base + "/" + clean.replace(/^\/+/, "")).split("/")) {
				if (seg === "" || seg === ".") continue;
				if (seg === "..") {
					if (parts.length === 0) return null;
					parts.pop();
					continue;
				}
				parts.push(seg);
			}
			return parts.length === 0 ? null : parts.join("/");
		}
		//#endregion
		//#region src/client/git-graph.ts
		function computeGraphLanes(commits) {
			const rows = [];
			const tips = [];
			let nextColor = 0;
			for (const commit of commits) {
				const before = tips.map((tip) => ({ ...tip }));
				let lane = tips.findIndex((tip) => tip.hash === commit.hash);
				const claimed = lane >= 0;
				if (lane === -1) {
					lane = tips.findIndex((tip) => tip.hash === null);
					if (lane === -1) {
						tips.push({
							hash: null,
							color: 0
						});
						lane = tips.length - 1;
					}
					tips[lane] = {
						hash: null,
						color: nextColor++
					};
				}
				const color = tips[lane].color;
				const inEdges = [];
				for (let i = 0; i < tips.length; i++) {
					if (tips[i].hash !== commit.hash) continue;
					if (i === lane) {
						if (claimed) inEdges.push({
							from: i,
							to: lane,
							color
						});
					} else {
						inEdges.push({
							from: i,
							to: lane,
							color: tips[i].color
						});
						tips[i] = {
							hash: null,
							color: 0
						};
					}
				}
				const outEdges = [];
				if (commit.parents.length === 0) tips[lane] = {
					hash: null,
					color: 0
				};
				else {
					const first = commit.parents[0];
					const firstTarget = tips.findIndex((tip, i) => i !== lane && tip.hash === first);
					if (firstTarget >= 0) {
						outEdges.push({
							from: lane,
							to: firstTarget,
							color
						});
						tips[lane] = {
							hash: null,
							color: 0
						};
					} else {
						tips[lane] = {
							hash: first,
							color
						};
						outEdges.push({
							from: lane,
							to: lane,
							color
						});
					}
					for (const parent of commit.parents.slice(1)) {
						const target = tips.findIndex((tip) => tip.hash === parent);
						if (target >= 0) {
							outEdges.push({
								from: lane,
								to: target,
								color: tips[target].color
							});
							continue;
						}
						let free = tips.findIndex((tip) => tip.hash === null);
						if (free === -1) {
							tips.push({
								hash: null,
								color: 0
							});
							free = tips.length - 1;
						}
						tips[free] = {
							hash: parent,
							color: nextColor++
						};
						outEdges.push({
							from: lane,
							to: free,
							color: tips[free].color
						});
					}
				}
				const pass = [];
				for (let i = 0; i < tips.length; i++) {
					if (i === lane || tips[i].hash === null) continue;
					if (before[i] !== void 0 && before[i].hash === tips[i].hash) pass.push({
						lane: i,
						color: tips[i].color
					});
				}
				let live = tips.length;
				while (live > 1 && tips[live - 1].hash === null) live -= 1;
				rows.push({
					lane,
					color,
					inEdges,
					outEdges,
					pass,
					laneCount: live
				});
			}
			return rows;
		}
		//#endregion
		//#region src/client/file-tree.ts
		function sortChildren(children) {
			return children.sort((a, b) => {
				if (a.kind !== b.kind) return a.kind === "dir" ? -1 : 1;
				return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
			});
		}
		function buildFileTree(files) {
			const root = {
				kind: "dir",
				name: "",
				path: "",
				children: [],
				fileCount: 0
			};
			const dirIndex = new Map([["", root]]);
			const ensureDir = (dirPath) => {
				const existing = dirIndex.get(dirPath);
				if (existing !== void 0) return existing;
				const slash = dirPath.lastIndexOf("/");
				const parent = ensureDir(slash === -1 ? "" : dirPath.slice(0, slash));
				const dir = {
					kind: "dir",
					name: dirPath.slice(slash + 1),
					path: dirPath,
					children: [],
					fileCount: 0
				};
				parent.children.push(dir);
				dirIndex.set(dirPath, dir);
				return dir;
			};
			for (const file of files) {
				const slash = file.path.lastIndexOf("/");
				ensureDir(slash === -1 ? "" : file.path.slice(0, slash)).children.push({
					kind: "file",
					name: file.path.slice(slash + 1),
					path: file.path,
					file
				});
			}
			const countFiles = (dir) => {
				let total = 0;
				for (const child of dir.children) if (child.kind === "file") total += 1;
				else total += countFiles(child);
				dir.fileCount = total;
				return total;
			};
			countFiles(root);
			const sortDeep = (dir) => {
				sortChildren(dir.children);
				for (const child of dir.children) if (child.kind === "dir") sortDeep(child);
			};
			sortDeep(root);
			return root;
		}
		function isUnmerged(x, y) {
			const pair = x + y;
			return pair === "UU" || pair === "AA" || pair === "DD" || pair === "AU" || pair === "UA" || pair === "DU" || pair === "UD";
		}
		function filterFiles(files, query) {
			const q = query.trim().toLowerCase();
			if (q === "") return [...files];
			return files.filter((file) => file.path.toLowerCase().includes(q));
		}
		function mergeAllFiles(allFiles, changed) {
			const index = new Map(changed.map((file) => [file.path, file]));
			return allFiles.map((path) => index.get(path) ?? {
				path,
				x: " ",
				y: " ",
				added: 0,
				deleted: 0,
				binary: false,
				untracked: false,
				unchanged: true
			});
		}
		function badgeForCode(code) {
			switch (code) {
				case "U": return {
					glyph: "U",
					key: "conflict",
					tone: "Error"
				};
				case "A": return {
					glyph: "+",
					key: "added",
					tone: "Success"
				};
				case "D": return {
					glyph: "−",
					key: "deleted",
					tone: "Error"
				};
				case "R": return {
					glyph: "R",
					key: "renamed",
					tone: "Business"
				};
				case "C": return {
					glyph: "C",
					key: "copied",
					tone: "Business"
				};
				case "M":
				case "T": return {
					glyph: "±",
					key: "modified",
					tone: "Business"
				};
				default: return null;
			}
		}
		function badgesFor(file) {
			if (file.unchanged === true) return [];
			if (file.untracked) return [{
				glyph: "?",
				key: "untracked",
				tone: "Muted"
			}];
			if (isUnmerged(file.x, file.y)) return [{
				glyph: "U",
				key: "conflict",
				tone: "Error"
			}];
			const out = [];
			const x = badgeForCode(file.x);
			if (x !== null) out.push({
				...x,
				staged: true
			});
			const y = badgeForCode(file.y);
			if (y !== null) out.push({
				...y,
				staged: false
			});
			return out.length > 0 ? out : [{
				glyph: "±",
				key: "modified",
				tone: "Business"
			}];
		}
		//#endregion
		//#region src/client/viewed.ts
		const VIEWED_KEY = "dsh-git-review.viewed";
		const VIEWED_CAP = 2e3;
		function parseViewed(raw) {
			if (raw === null) return [];
			let parsed;
			try {
				parsed = JSON.parse(raw);
			} catch {
				return [];
			}
			if (!Array.isArray(parsed)) return [];
			const seen = new Set();
			for (const item of parsed) {
				if (typeof item === "string" && item !== "") seen.add(item);
				if (seen.size >= 2e3) break;
			}
			return [...seen];
		}
		function createViewedStore(storage = typeof localStorage === "undefined" ? void 0 : localStorage) {
			let order;
			try {
				order = parseViewed(storage?.getItem("dsh-git-review.viewed") ?? null);
			} catch {
				order = [];
			}
			const set = new Set(order);
			const persist = () => {
				if (storage === void 0) return;
				try {
					storage.setItem(VIEWED_KEY, JSON.stringify(order));
				} catch {}
			};
			return {
				has(blob) {
					return set.has(blob);
				},
				toggle(blob) {
					const marked = !set.has(blob);
					if (marked) {
						set.add(blob);
						order.unshift(blob);
						if (order.length > 2e3) for (const dropped of order.splice(VIEWED_CAP)) set.delete(dropped);
					} else {
						set.delete(blob);
						order = order.filter((item) => item !== blob);
					}
					persist();
					return marked;
				}
			};
		}
		//#endregion
		//#region src/client/comment-drafts.ts
		function draftsKey(cwd) {
			return "dsh-git-review.drafts:" + encodeURIComponent(cwd);
		}
		const DRAFT_TEXT_CAP = 4e3;
		function normalizeDraft(record) {
			if (typeof record["path"] !== "string" || record["path"] === "" || record["path"].length > 1024) return null;
			if (typeof record["text"] !== "string" || record["text"] === "") return null;
			if (typeof record["line"] !== "number" || !Number.isFinite(record["line"])) return null;
			return {
				path: record["path"],
				line: Math.max(1, Math.trunc(record["line"])),
				text: record["text"].slice(0, DRAFT_TEXT_CAP)
			};
		}
		function parseDrafts(raw) {
			if (raw === null) return [];
			let parsed;
			try {
				parsed = JSON.parse(raw);
			} catch {
				return [];
			}
			if (!Array.isArray(parsed)) return [];
			const out = [];
			for (const item of parsed) {
				if (item === null || typeof item !== "object") continue;
				const draft = normalizeDraft(item);
				if (draft !== null) out.push(draft);
				if (out.length >= 200) break;
			}
			return out;
		}
		function createDraftBox(cwd, storage = typeof localStorage === "undefined" ? void 0 : localStorage) {
			const key = draftsKey(cwd);
			let items;
			try {
				items = parseDrafts(storage?.getItem(key) ?? null);
			} catch {
				items = [];
			}
			const persist = () => {
				if (storage === void 0) return;
				try {
					storage.setItem(key, JSON.stringify(items));
				} catch {}
			};
			return {
				list: () => [...items],
				add(draft) {
					const clean = normalizeDraft({
						path: draft.path,
						line: draft.line,
						text: draft.text
					});
					if (clean === null) return;
					items.push(clean);
					while (items.length > 200) items.shift();
					persist();
				},
				remove(index) {
					if (index < 0 || index >= items.length) return;
					items.splice(index, 1);
					persist();
				},
				clear() {
					items = [];
					persist();
				}
			};
		}
		//#endregion
		//#region src/client/tree-panel.tsx
		function badgeClass(tone) {
			return tone === "Success" ? review_module_css_default.badgeSuccess : tone === "Business" ? review_module_css_default.badgeBusiness : tone === "Error" ? review_module_css_default.badgeError : review_module_css_default.badgeMuted;
		}
		function FileRow({ entry, depth, selected, onSelect, matchCount, viewedHas, onToggleViewed, onFileMenu, t }) {
			const badges = badgesFor(entry.file);
			const blob = entry.file.blob;
			const viewed = blob !== void 0 && viewedHas !== void 0 && viewedHas(blob);
			const viewedTitle = viewed ? t("viewed.marked") : t("viewed.mark");
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: review_module_css_default.fileRow + (selected === entry.path ? " " + review_module_css_default.fileRowActive : ""),
				style: { paddingLeft: 8 + depth * 12 },
				onClick: () => {
					onSelect(entry.path);
				},
				onContextMenu: onFileMenu === void 0 ? void 0 : (event) => {
					event.preventDefault();
					onFileMenu(entry.path, event.clientX, event.clientY, entry.file);
				},
				title: entry.file.origPath === void 0 ? entry.path : entry.path + " ← " + entry.file.origPath,
				children: [
					blob !== void 0 && viewedHas !== void 0 && onToggleViewed !== void 0 && (0, react_jsx_runtime.jsx)("span", {
						role: "checkbox",
						"aria-checked": viewed,
						"aria-label": viewedTitle,
						title: viewedTitle,
						tabIndex: 0,
						className: review_module_css_default.viewedDot + (viewed ? " " + review_module_css_default.viewedDotDone : ""),
						onClick: (event) => {
							event.stopPropagation();
							onToggleViewed(blob);
						},
						onKeyDown: (event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								event.stopPropagation();
								onToggleViewed(blob);
							}
						},
						children: viewed ? "✓" : ""
					}),
					(0, react_jsx_runtime.jsx)(FileTypeIcon, { path: entry.path }),
					(0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.fileName,
						children: entry.name
					}),
					badges.map((badge, index) => (0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.badge + " " + badgeClass(badge.tone),
						title: (badge.staged === true ? t("badge.staged") + " · " : badge.staged === false ? t("scope.unstaged") + " · " : "") + t("badge." + badge.key),
						children: badge.glyph
					}, index)),
					(matchCount ?? 0) > 0 && (0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.matchChip,
						children: matchCount
					})
				]
			});
		}
		function Node({ entry, depth, selected, onSelect, collapsed, onToggleDir, matchCounts, viewedHas, onToggleViewed, onFileMenu, t }) {
			if (entry.kind === "file") return (0, react_jsx_runtime.jsx)(FileRow, {
				entry,
				depth,
				selected,
				onSelect,
				matchCount: matchCounts?.get(entry.path),
				viewedHas,
				onToggleViewed,
				onFileMenu,
				t
			});
			const isCollapsed = collapsed.has(entry.path);
			return (0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: review_module_css_default.dirRow,
				style: { paddingLeft: 6 + depth * 12 },
				onClick: () => {
					onToggleDir(entry.path);
				},
				title: entry.path === "" ? void 0 : entry.path,
				children: [
					(0, react_jsx_runtime.jsx)(ChevronIcon, { rotated: !isCollapsed }),
					(0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.dirName,
						children: entry.name
					}),
					(0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.dirCount,
						children: entry.fileCount
					})
				]
			}), !isCollapsed && entry.children.map((child) => (0, react_jsx_runtime.jsx)(Node, {
				entry: child,
				depth: depth + 1,
				selected,
				onSelect,
				collapsed,
				onToggleDir,
				matchCounts,
				viewedHas,
				onToggleViewed,
				onFileMenu,
				t
			}, child.kind + ":" + child.path))] });
		}
		function TreePanel({ files, selected, onSelect, filter, onFilterChange, collapsed, onToggleDir, mode, onModeChange, width, showModeRow = true, showFilter = true, listFailed, matchCounts, viewedHas, onToggleViewed, pendingCount, onFileMenu, t }) {
			const visible = (0, react.useMemo)(() => filterFiles(files, filter), [files, filter]);
			const tree = (0, react.useMemo)(() => buildFileTree(visible), [visible]);
			const flat = filter.trim() !== "";
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.treePanel,
				"data-git-review-tree": "",
				style: width !== void 0 ? { width } : void 0,
				children: [
					pendingCount !== void 0 && pendingCount > 0 && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.treePending,
						children: t("tree.pending", { count: pendingCount })
					}),
					showModeRow && (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.treeModeRow,
						children: (0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.scopeSwitch,
							role: "group",
							"aria-label": t("tree.mode.label"),
							children: ["changes", "all"].map((candidate) => (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.scopeBtn + (mode === candidate ? " " + review_module_css_default.scopeBtnActive : ""),
								onClick: () => {
									onModeChange(candidate);
								},
								children: t("tree.mode." + candidate)
							}, candidate))
						})
					}),
					showFilter && (0, react_jsx_runtime.jsxs)("label", {
						className: review_module_css_default.filterRow,
						children: [(0, react_jsx_runtime.jsx)(SearchIcon, {}), (0, react_jsx_runtime.jsx)("input", {
							className: review_module_css_default.filterInput,
							value: filter,
							onChange: (event) => {
								onFilterChange(event.target.value);
							},
							placeholder: t("filter"),
							spellCheck: false
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.treeScroll,
						children: visible.length === 0 ? (0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.treeEmpty,
							children: t(listFailed ? "tree.listFailed" : mode === "all" ? "tree.empty" : files.length === 0 ? "tree.noChanges" : "tree.empty")
						}) : flat ? visible.map((file) => (0, react_jsx_runtime.jsx)(FileRow, {
							entry: {
								kind: "file",
								name: file.path,
								path: file.path,
								file
							},
							depth: 0,
							selected,
							onSelect,
							matchCount: matchCounts?.get(file.path),
							viewedHas,
							onToggleViewed,
							onFileMenu,
							t
						}, file.path)) : tree.children.map((child) => (0, react_jsx_runtime.jsx)(Node, {
							entry: child,
							depth: 0,
							selected,
							onSelect,
							collapsed,
							onToggleDir,
							matchCounts,
							viewedHas,
							onToggleViewed,
							onFileMenu,
							t
						}, child.kind + ":" + child.path))
					})
				]
			});
		}
		//#endregion
		//#region src/client/review-view.tsx
		async function loadStatus(cwd, base, target, wsIgnore) {
			const payload = await hostCall("status", {
				cwd,
				base,
				target,
				ws: wsIgnore
			});
			if (payload === null) return { kind: "hostUnavailable" };
			if (!payload.ok) return payload.isRepository === false ? { kind: "notRepo" } : {
				kind: "error",
				message: payload.error
			};
			return {
				kind: "ready",
				data: payload
			};
		}
		async function loadFileDiff(cwd, path, origPath, untracked, full, scope, base, target, wsIgnore) {
			const payload = await hostCall("file-diff", {
				cwd,
				path,
				origPath,
				untracked,
				full,
				scope,
				base,
				target,
				ws: wsIgnore
			});
			if (payload === null) return {
				kind: "failed",
				message: "host unavailable"
			};
			if (!payload.ok) return {
				kind: "failed",
				message: payload.error ?? "unknown error"
			};
			return payload.binary ? {
				kind: "binary",
				size: payload.size
			} : {
				kind: "text",
				diff: payload.diff,
				truncated: payload.truncated
			};
		}
		async function loadPreviewBytes(cwd, path, ref) {
			const payload = await hostCall("file-bytes", ref ? {
				cwd,
				path,
				ref
			} : {
				cwd,
				path
			});
			if (payload === null) return {
				kind: "failed",
				message: "host unavailable"
			};
			if (!payload.ok) return {
				kind: "failed",
				message: payload.error ?? "unknown error"
			};
			return {
				kind: "ready",
				mime: payload.mime,
				base64: payload.base64,
				size: payload.size,
				truncated: payload.truncated
			};
		}
		async function loadFileContent(cwd, path, ref) {
			const payload = await hostCall("file-content", ref ? {
				cwd,
				path,
				ref
			} : {
				cwd,
				path
			});
			if (payload === null) return {
				kind: "failed",
				message: "host unavailable"
			};
			if (!payload.ok) return {
				kind: "failed",
				message: payload.error ?? "unknown error"
			};
			return payload.binary ? {
				kind: "binary",
				size: payload.size
			} : {
				kind: "content",
				content: payload.content,
				truncated: payload.truncated,
				size: payload.size
			};
		}
		function fmtCount(value) {
			return value.toLocaleString("en-US");
		}
		function ReviewView({ cwd, settings, t, useSession, useInput, inputActions }) {
			const running = useSession !== void 0 ? useSession((s) => s.running) ?? false : false;
			const [status, setStatus] = (0, react.useState)({ kind: "loading" });
			const [reloadTick, setReloadTick] = (0, react.useState)(0);
			const [selected, setSelected] = (0, react.useState)(null);
			const [collapsed, setCollapsed] = (0, react.useState)(new Set());
			const [diffFull, setDiffFull] = (0, react.useState)(false);
			const [diffScope, setDiffScope] = (0, react.useState)("all");
			const [hunkBusy, setHunkBusy] = (0, react.useState)(false);
			const [hunkNotice, setHunkNotice] = (0, react.useState)(null);
			const [diff, setDiff] = (0, react.useState)({ kind: "idle" });
			const [blameOn, setBlameOn] = (0, react.useState)(false);
			const [blameState, setBlameState] = (0, react.useState)({
				kind: "idle",
				lines: null,
				message: null
			});
			const [historyState, setHistoryState] = (0, react.useState)({ kind: "closed" });
			const historyPopRef = (0, react.useRef)(null);
			const [treeWidth, setTreeWidth] = (0, react.useState)(() => {
				try {
					const stored = Number(localStorage.getItem("dsh-git-review.treeWidth"));
					return Number.isFinite(stored) && stored >= 200 && stored <= 460 ? stored : null;
				} catch {
					return null;
				}
			});
			const treeResizeRef = (0, react.useRef)(null);
			const startTreeResize = (0, react.useCallback)((event) => {
				event.preventDefault();
				treeResizeRef.current = {
					startX: event.clientX,
					startWidth: treeWidth ?? 260
				};
				const onMove = (move) => {
					const state = treeResizeRef.current;
					if (state === null) return;
					setTreeWidth(Math.min(460, Math.max(200, state.startWidth + (state.startX - move.clientX))));
				};
				const onUp = (move) => {
					const state = treeResizeRef.current;
					treeResizeRef.current = null;
					document.removeEventListener("mousemove", onMove);
					document.removeEventListener("mouseup", onUp);
					if (state === null) return;
					const final = Math.min(460, Math.max(200, state.startWidth + (state.startX - move.clientX)));
					try {
						localStorage.setItem("dsh-git-review.treeWidth", String(final));
					} catch {}
				};
				document.addEventListener("mousemove", onMove);
				document.addEventListener("mouseup", onUp);
			}, [treeWidth]);
			const [treeMode, setTreeMode] = (0, react.useState)("changes");
			const [allFiles, setAllFiles] = (0, react.useState)(null);
			const [allFilesFailed, setAllFilesFailed] = (0, react.useState)(false);
			const initialPrefs = settings.store.getSnapshot().prefs;
			const [viewMode, setViewMode] = (0, react.useState)(initialPrefs.viewMode);
			const [fileView, setFileView] = (0, react.useState)(false);
			const [previewSource, setPreviewSource] = (0, react.useState)(false);
			const [previewBytes, setPreviewBytes] = (0, react.useState)({ kind: "idle" });
			const [searchDraft, setSearchDraft] = (0, react.useState)("");
			const [search, setSearch] = (0, react.useState)("");
			const [searchScope, setSearchScope] = (0, react.useState)(initialPrefs.searchScope);
			const [searchCS, setSearchCS] = (0, react.useState)(initialPrefs.searchCS);
			const [searchRegex, setSearchRegex] = (0, react.useState)(initialPrefs.searchRegex);
			const [wsIgnore, setWsIgnore] = (0, react.useState)(initialPrefs.wsIgnore);
			const [syntaxHighlight, setSyntaxHighlight] = (0, react.useState)(initialPrefs.syntaxHighlight);
			const [searchOptionsOpen, setSearchOptionsOpen] = (0, react.useState)(false);
			const [searchMatches, setSearchMatches] = (0, react.useState)(null);
			const [compareMode, setCompareMode] = (0, react.useState)("worktree");
			const [baseRef, setBaseRef] = (0, react.useState)(null);
			const [targetRef, setTargetRef] = (0, react.useState)(null);
			const [refs, setRefs] = (0, react.useState)(null);
			const [pickerCommits, setPickerCommits] = (0, react.useState)(null);
			const refsMode = compareMode === "refs";
			const rangeReady = !refsMode || baseRef !== null && targetRef !== null;
			const [viewTab, setViewTab] = (0, react.useState)("changes");
			const [logState, setLogState] = (0, react.useState)({ kind: "idle" });
			const [selectedCommit, setSelectedCommit] = (0, react.useState)(null);
			const [infoOpenHash, setInfoOpenHash] = (0, react.useState)(null);
			const [graphFile, setGraphFile] = (0, react.useState)(null);
			const [graphFilter, setGraphFilter] = (0, react.useState)("");
			const [graphCollapsed, setGraphCollapsed] = (0, react.useState)(new Set());
			const [graphListCollapsed, setGraphListCollapsed] = (0, react.useState)(initialPrefs.graphCollapsed);
			const [graphWorktree, setGraphWorktree] = (0, react.useState)(false);
			const [graphWorktreeFile, setGraphWorktreeFile] = (0, react.useState)(null);
			const [graphLoadingMore, setGraphLoadingMore] = (0, react.useState)(false);
			const [commitFiles, setCommitFiles] = (0, react.useState)(null);
			const [commitTotals, setCommitTotals] = (0, react.useState)(null);
			const [copiedHash, setCopiedHash] = (0, react.useState)(false);
			const [commitOpen, setCommitOpen] = (0, react.useState)(false);
			const [commitMessage, setCommitMessage] = (0, react.useState)("");
			const [stageAll, setStageAll] = (0, react.useState)(true);
			const [armed, setArmed] = (0, react.useState)(null);
			const [writeState, setWriteState] = (0, react.useState)({ kind: "idle" });
			const [branchOpen, setBranchOpen] = (0, react.useState)(false);
			const branchPopRef = (0, react.useRef)(null);
			const commitPopRef = (0, react.useRef)(null);
			const branchBtnRef = (0, react.useRef)(null);
			const commitBtnRef = (0, react.useRef)(null);
			const draftPopRef = (0, react.useRef)(null);
			const draftBtnRef = (0, react.useRef)(null);
			const searchOptionsRef = (0, react.useRef)(null);
			const rootRef = (0, react.useRef)(null);
			const searchInputRef = (0, react.useRef)(null);
			const draftBox = (0, react.useMemo)(() => cwd === void 0 ? null : createDraftBox(cwd), [cwd]);
			const [draftList, setDraftList] = (0, react.useState)([]);
			const [draftOpen, setDraftOpen] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				setDraftList(draftBox?.list() ?? []);
			}, [draftBox]);
			const addDraft = (0, react.useCallback)((draft) => {
				draftBox?.add(draft);
				setDraftList(draftBox?.list() ?? []);
			}, [draftBox]);
			(0, react.useEffect)(() => {
				if (!branchOpen && !commitOpen && !draftOpen) return;
				const onDown = (event) => {
					const target = event.target;
					if (branchOpen && branchPopRef.current !== null && !branchPopRef.current.contains(target) && (branchBtnRef.current === null || !branchBtnRef.current.contains(target))) setBranchOpen(false);
					if (commitOpen && commitPopRef.current !== null && !commitPopRef.current.contains(target) && (commitBtnRef.current === null || !commitBtnRef.current.contains(target))) setCommitOpen(false);
					if (draftOpen && draftPopRef.current !== null && !draftPopRef.current.contains(target) && (draftBtnRef.current === null || !draftBtnRef.current.contains(target))) setDraftOpen(false);
				};
				document.addEventListener("mousedown", onDown);
				return () => {
					document.removeEventListener("mousedown", onDown);
				};
			}, [
				branchOpen,
				commitOpen,
				draftOpen
			]);
			(0, react.useEffect)(() => {
				if (!searchOptionsOpen) return;
				const onDown = (event) => {
					const root = searchOptionsRef.current;
					if (root !== null && !root.contains(event.target)) setSearchOptionsOpen(false);
				};
				document.addEventListener("mousedown", onDown);
				return () => {
					document.removeEventListener("mousedown", onDown);
				};
			}, [searchOptionsOpen]);
			(0, react.useEffect)(() => {
				if (historyState.kind !== "open") return;
				const onDown = (event) => {
					const root = historyPopRef.current;
					if (root !== null && !root.contains(event.target)) setHistoryState({ kind: "closed" });
				};
				document.addEventListener("mousedown", onDown);
				return () => {
					document.removeEventListener("mousedown", onDown);
				};
			}, [historyState.kind]);
			(0, react.useEffect)(() => settings.store.subscribe(() => {
				const prefs = settings.store.getSnapshot().prefs;
				setViewMode(prefs.viewMode);
				setSearchScope(prefs.searchScope);
				setGraphListCollapsed(prefs.graphCollapsed);
				setSearchCS(prefs.searchCS);
				setSearchRegex(prefs.searchRegex);
				setWsIgnore(prefs.wsIgnore);
				setSyntaxHighlight(prefs.syntaxHighlight);
			}), [settings]);
			const [branchName, setBranchName] = (0, react.useState)("");
			const [branchStart, setBranchStart] = (0, react.useState)("");
			const [branchBusy, setBranchBusy] = (0, react.useState)(false);
			const [branchResult, setBranchResult] = (0, react.useState)(null);
			const [renameTarget, setRenameTarget] = (0, react.useState)(null);
			const [renameValue, setRenameValue] = (0, react.useState)("");
			const [deleteArmed, setDeleteArmed] = (0, react.useState)(null);
			const [stashList, setStashList] = (0, react.useState)(null);
			const [stashOpen, setStashOpen] = (0, react.useState)(false);
			const [stashIncludeUntracked, setStashIncludeUntracked] = (0, react.useState)(true);
			const [stashArmed, setStashArmed] = (0, react.useState)(null);
			const [tagName, setTagName] = (0, react.useState)("");
			const [tagTarget, setTagTarget] = (0, react.useState)("");
			const [tagDeleteArmed, setTagDeleteArmed] = (0, react.useState)(null);
			const [guideSeen, setGuideSeen] = (0, react.useState)(() => {
				try {
					return window.localStorage.getItem("dsh-git-review.guideSeen") === "1";
				} catch {
					return true;
				}
			});
			const [amend, setAmend] = (0, react.useState)(false);
			const [commitMenu, setCommitMenu] = (0, react.useState)(null);
			const [conflictAbortArmed, setConflictAbortArmed] = (0, react.useState)(false);
			const [fileMenu, setFileMenu] = (0, react.useState)(null);
			const [openApps, setOpenApps] = (0, react.useState)(null);
			const viewedStore = (0, react.useMemo)(() => createViewedStore(), [cwd]);
			const [viewedTick, bumpViewed] = (0, react.useReducer)((count) => count + 1, 0);
			const viewedHas = (0, react.useCallback)((blob) => viewedStore.has(blob), [viewedStore]);
			const toggleViewed = (0, react.useCallback)((blob) => {
				viewedStore.toggle(blob);
				bumpViewed();
			}, [viewedStore]);
			(0, react.useEffect)(() => {
				if (cwd === void 0) {
					setStatus({ kind: "noWorkspace" });
					return;
				}
				if (!rangeReady) {
					setStatus({ kind: "loading" });
					return;
				}
				let alive = true;
				setStatus((previous) => previous.kind === "ready" || previous.kind === "error" ? previous : { kind: "loading" });
				loadStatus(cwd, baseRef, refsMode ? targetRef : null, wsIgnore).then((next) => {
					if (alive) setStatus(next);
				});
				return () => {
					alive = false;
				};
			}, [
				cwd,
				reloadTick,
				baseRef,
				targetRef,
				compareMode,
				wsIgnore
			]);
			(0, react.useEffect)(() => {
				if (cwd === void 0) {
					setRefs(null);
					setPickerCommits(null);
					return;
				}
				let alive = true;
				hostCall("refs", { cwd }).then((payload) => {
					if (alive) setRefs(payload !== null && payload.ok ? payload.refs : null);
				});
				hostCall("log", {
					cwd,
					limit: 120
				}).then((payload) => {
					if (alive) setPickerCommits(payload !== null && payload.ok ? payload.commits : null);
				});
				return () => {
					alive = false;
				};
			}, [cwd, reloadTick]);
			(0, react.useEffect)(() => {
				let alive = true;
				hostCall("apps", {}).then((payload) => {
					if (alive) setOpenApps(payload !== null && payload.ok ? payload.apps : null);
				});
				return () => {
					alive = false;
				};
			}, []);
			(0, react.useEffect)(() => {
				if (refsMode) setTreeMode("changes");
			}, [refsMode]);
			(0, react.useEffect)(() => {
				if (treeMode !== "all" || cwd === void 0 || refsMode) return;
				let alive = true;
				hostCall("list-files", { cwd }).then((payload) => {
					if (!alive) return;
					if (payload === null || !payload.ok) {
						setAllFiles([]);
						setAllFilesFailed(true);
						return;
					}
					setAllFiles(payload.files);
					setAllFilesFailed(false);
				});
				return () => {
					alive = false;
				};
			}, [
				treeMode,
				cwd,
				reloadTick,
				refsMode
			]);
			(0, react.useEffect)(() => {
				const trimmed = searchDraft.trim();
				if (trimmed === "") {
					setSearch("");
					return;
				}
				const timer = setTimeout(() => {
					setSearch(trimmed);
				}, 400);
				return () => {
					clearTimeout(timer);
				};
			}, [searchDraft]);
			(0, react.useEffect)(() => {
				if (search === "" || searchScope === "path" || cwd === void 0 || !rangeReady || viewTab !== "changes") {
					setSearchMatches(null);
					return;
				}
				let alive = true;
				hostCall("search", {
					cwd,
					query: search,
					base: baseRef,
					target: refsMode ? targetRef : null,
					mode: searchScope === "content" ? "content" : "diff",
					cs: searchCS,
					rx: searchRegex,
					ws: wsIgnore
				}).then((payload) => {
					if (!alive) return;
					setSearchMatches(payload !== null && payload.ok ? new Map(payload.matches.map((match) => [match.path, match.count])) : null);
				});
				return () => {
					alive = false;
				};
			}, [
				search,
				searchScope,
				searchCS,
				searchRegex,
				wsIgnore,
				cwd,
				reloadTick,
				baseRef,
				targetRef,
				compareMode,
				viewTab
			]);
			(0, react.useEffect)(() => {
				if (viewTab !== "graph" || cwd === void 0) return;
				let alive = true;
				setLogState({ kind: "loading" });
				hostCall("log", { cwd }).then((payload) => {
					if (!alive) return;
					if (payload === null) setLogState({
						kind: "failed",
						message: t("state.hostUnavailable")
					});
					else if (!payload.ok) setLogState({
						kind: "failed",
						message: payload.error ?? t("graph.failed")
					});
					else setLogState({
						kind: "ready",
						commits: payload.commits,
						truncated: payload.truncated
					});
				});
				return () => {
					alive = false;
				};
			}, [
				viewTab,
				cwd,
				reloadTick,
				t
			]);
			(0, react.useEffect)(() => {
				if (viewTab !== "graph" || cwd === void 0 || selectedCommit === null) {
					setCommitFiles(null);
					setCommitTotals(null);
					return;
				}
				let alive = true;
				setCommitFiles(null);
				setCommitTotals(null);
				hostCall("commit-files", {
					cwd,
					commit: selectedCommit
				}).then((payload) => {
					if (!alive) return;
					if (payload !== null && payload.ok) {
						setCommitFiles(payload.files);
						setCommitTotals(payload.totals);
						setGraphFile(payload.files.length > 0 ? payload.files[0].path : null);
					} else setCommitFiles([]);
				});
				return () => {
					alive = false;
				};
			}, [
				viewTab,
				cwd,
				selectedCommit
			]);
			const copyCommitHash = (0, react.useCallback)(() => {
				if (selectedCommit === null) return;
				navigator.clipboard?.writeText(selectedCommit).then(() => {
					setCopiedHash(true);
					window.setTimeout(() => {
						setCopiedHash(false);
					}, 1500);
				}).catch(() => {});
			}, [selectedCommit]);
			const ready = status.kind === "ready" ? status.data : null;
			const searchSpec = (0, react.useMemo)(() => ({
				query: search,
				caseSensitive: searchCS,
				regex: searchRegex
			}), [
				search,
				searchCS,
				searchRegex
			]);
			const graphCommits = logState.kind === "ready" ? logState.commits : [];
			const graphLanes = (0, react.useMemo)(() => computeGraphLanes(graphCommits), [graphCommits]);
			const visibleGraph = (0, react.useMemo)(() => {
				const query = graphFilter.trim().toLowerCase();
				const rows = graphCommits.map((commit, index) => ({
					commit,
					lane: graphLanes[index]
				}));
				if (query === "") return rows;
				return rows.filter(({ commit }) => commit.subject.toLowerCase().includes(query) || commit.authorName.toLowerCase().includes(query) || commit.hash.startsWith(query));
			}, [
				graphCommits,
				graphLanes,
				graphFilter
			]);
			const allRows = (0, react.useMemo)(() => treeMode === "all" && !refsMode && allFiles !== null ? mergeAllFiles(allFiles, ready?.files ?? []) : null, [
				treeMode,
				refsMode,
				allFiles,
				ready
			]);
			const pendingCount = (0, react.useMemo)(() => {
				if (viewTab !== "changes" || refsMode || ready === null) return void 0;
				return ready.files.filter((file) => file.blob !== void 0 && !viewedStore.has(file.blob)).length;
			}, [
				viewTab,
				refsMode,
				ready,
				viewedStore,
				viewedTick
			]);
			const selectedFile = (0, react.useMemo)(() => {
				return (allRows ?? ready?.files)?.find((file) => file.path === selected) ?? null;
			}, [
				allRows,
				ready,
				selected
			]);
			const effectiveView = fileView || selectedFile?.unchanged === true ? "file" : viewMode;
			const previewKind = selectedFile !== null ? previewKindForPath(selectedFile.path) : null;
			const previewSvg = selectedFile !== null && selectedFile.path.toLowerCase().endsWith(".svg");
			const previewMdOk = previewKind !== "markdown" || markdownRenderer() !== null;
			const previewSvgOk = !previewSvg || diff.kind === "content" && diff.content.toLowerCase().includes("<svg");
			const previewAvailable = previewKind !== null && previewMdOk && previewSvgOk;
			const showPreview = previewAvailable && !previewSource && (previewKind === "markdown" || previewKind === "html" || previewSvg ? diff.kind === "content" : true);
			const previewDataUrl = !showPreview || previewKind === null ? null : previewSvg && diff.kind === "content" ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(diff.content) : previewBytes.kind === "ready" && !previewBytes.truncated && (previewKind === "pdf" ? previewBytes.mime === "application/pdf" : previewBytes.mime.startsWith("image/")) ? "data:" + previewBytes.mime + ";base64," + previewBytes.base64 : null;
			const previewBytesFailed = showPreview && previewKind !== null && previewKind !== "markdown" && !previewSvg && (previewBytes.kind === "failed" || previewBytes.kind === "ready" && (previewBytes.truncated || (previewKind === "pdf" ? previewBytes.mime !== "application/pdf" : !previewBytes.mime.startsWith("image/"))));
			const mdFallback = (0, react.useMemo)(() => previewKind === "markdown" && diff.kind === "content" ? htmlFallbackForPreview(diff.content) : null, [previewKind, diff]);
			const mdText = (0, react.useMemo)(() => {
				if (previewKind !== "markdown" || mdFallback === null || selected === null || cwd === void 0) return mdFallback ?? "";
				const ref = refsMode && targetRef !== null ? targetRef : null;
				const table = new Map();
				for (const url of collectMdAssets(mdFallback).slice(0, 10)) {
					const rel = resolveMdAsset(selected, url);
					if (rel !== null) table.set(url, assetUrl(cwd, rel, ref));
				}
				return rewriteMdAssets(mdFallback, table);
			}, [
				previewKind,
				mdFallback,
				selected,
				cwd,
				refsMode,
				targetRef
			]);
			(0, react.useEffect)(() => {
				if (viewTab !== "changes") return;
				if (cwd === void 0 || selected === null || selectedFile === null) {
					setDiff({ kind: "idle" });
					return;
				}
				let alive = true;
				setDiff({ kind: "loading" });
				(selectedFile.unchanged === true || effectiveView === "file" ? loadFileContent(cwd, selected, refsMode && targetRef !== null ? targetRef : null) : loadFileDiff(cwd, selected, selectedFile.origPath, selectedFile.untracked, diffFull, diffScope, baseRef, refsMode ? targetRef : null, wsIgnore)).then((next) => {
					if (alive) setDiff(next);
				});
				return () => {
					alive = false;
				};
			}, [
				cwd,
				selected,
				selectedFile,
				selectedFile?.untracked,
				selectedFile?.origPath,
				diffFull,
				diffScope,
				effectiveView,
				baseRef,
				targetRef,
				compareMode,
				viewTab,
				wsIgnore
			]);
			(0, react.useEffect)(() => {
				if (viewTab !== "changes" || previewSource || cwd === void 0 || selected === null) return;
				const kind = previewKindForPath(selected);
				if (kind !== "image" && kind !== "pdf") return;
				if (kind === "image" && selected.toLowerCase().endsWith(".svg")) return;
				let alive = true;
				setPreviewBytes({ kind: "loading" });
				loadPreviewBytes(cwd, selected, refsMode && targetRef !== null ? targetRef : null).then((next) => {
					if (alive) setPreviewBytes(next);
				});
				return () => {
					alive = false;
				};
			}, [
				cwd,
				selected,
				viewTab,
				previewSource,
				refsMode,
				targetRef
			]);
			const commitInfo = (0, react.useMemo)(() => logState.kind === "ready" && selectedCommit !== null ? logState.commits.find((commit) => commit.hash === selectedCommit) ?? null : null, [logState, selectedCommit]);
			const graphFileInfo = (0, react.useMemo)(() => commitFiles?.find((file) => file.path === graphFile) ?? null, [commitFiles, graphFile]);
			(0, react.useEffect)(() => {
				if (viewTab !== "graph") return;
				if (cwd === void 0 || selectedCommit === null || graphFileInfo === null) {
					setDiff({ kind: "idle" });
					return;
				}
				let alive = true;
				setDiff({ kind: "loading" });
				const parent0 = commitInfo !== null && commitInfo.parents.length > 0 ? commitInfo.parents[0] : EMPTY_TREE_ID;
				loadFileDiff(cwd, graphFileInfo.path, graphFileInfo.origPath, false, diffFull, "all", parent0, selectedCommit, wsIgnore).then((next) => {
					if (alive) setDiff(next);
				});
				return () => {
					alive = false;
				};
			}, [
				viewTab,
				cwd,
				selectedCommit,
				graphFileInfo,
				commitInfo,
				diffFull,
				wsIgnore
			]);
			(0, react.useEffect)(() => {
				if (viewTab !== "graph" || !graphWorktree || cwd === void 0) return;
				const file = ready?.files.find((item) => item.path === graphWorktreeFile) ?? null;
				if (graphWorktreeFile === null || file === null) {
					setDiff({ kind: "idle" });
					return;
				}
				let alive = true;
				setDiff({ kind: "loading" });
				(file.unchanged === true || effectiveView === "file" ? loadFileContent(cwd, graphWorktreeFile) : loadFileDiff(cwd, graphWorktreeFile, file.origPath, file.untracked, diffFull, diffScope, null, null, wsIgnore)).then((next) => {
					if (alive) setDiff(next);
				});
				return () => {
					alive = false;
				};
			}, [
				viewTab,
				graphWorktree,
				cwd,
				graphWorktreeFile,
				ready,
				effectiveView,
				diffFull,
				diffScope,
				wsIgnore
			]);
			const toggleDir = (0, react.useCallback)((path) => {
				setCollapsed((previous) => {
					const next = new Set(previous);
					if (next.has(path)) next.delete(path);
					else next.add(path);
					return next;
				});
			}, []);
			const refresh = (0, react.useCallback)(() => {
				setReloadTick((tick) => tick + 1);
			}, []);
			const runningPrevRef = (0, react.useRef)(false);
			(0, react.useEffect)(() => {
				if (runningPrevRef.current && !running) refresh();
				runningPrevRef.current = running;
			}, [running, refresh]);
			const selectFile = (0, react.useCallback)((path) => {
				setSelected(path);
				setDiffScope("all");
				setHunkNotice(null);
				setBlameOn(false);
				setPreviewSource(false);
				setPreviewBytes({ kind: "idle" });
				setHistoryState({ kind: "closed" });
			}, []);
			const blameRef = refsMode && targetRef !== null ? targetRef : null;
			(0, react.useEffect)(() => {
				if (!blameOn || cwd === void 0 || selected === null || effectiveView !== "file") {
					setBlameState({
						kind: "idle",
						lines: null,
						message: null
					});
					return;
				}
				let alive = true;
				setBlameState({
					kind: "loading",
					lines: null,
					message: null
				});
				hostCall("blame", blameRef !== null ? {
					cwd,
					path: selected,
					ref: blameRef
				} : {
					cwd,
					path: selected
				}).then((payload) => {
					if (!alive) return;
					if (payload === null) setBlameState({
						kind: "failed",
						lines: null,
						message: t("state.hostUnavailable")
					});
					else if (!payload.ok) setBlameState({
						kind: "failed",
						lines: null,
						message: "blame failed"
					});
					else setBlameState({
						kind: "ready",
						lines: payload.lines,
						message: null
					});
				});
				return () => {
					alive = false;
				};
			}, [
				blameOn,
				cwd,
				selected,
				effectiveView,
				blameRef,
				t
			]);
			const historyReqRef = (0, react.useRef)(0);
			const openFileHistory = (0, react.useCallback)((path, x, y) => {
				if (cwd === void 0) return;
				historyReqRef.current += 1;
				const ticket = historyReqRef.current;
				setHistoryState({ kind: "loading" });
				hostCall("file-history", {
					cwd,
					path
				}).then((payload) => {
					if (historyReqRef.current !== ticket) return;
					setHistoryState((current) => {
						if (current.kind !== "loading") return current;
						if (payload === null || !payload.ok) return {
							kind: "open",
							x,
							y,
							commits: [],
							truncated: false
						};
						return {
							kind: "open",
							x,
							y,
							commits: payload.commits,
							truncated: payload.truncated
						};
					});
				});
			}, [cwd]);
			const hunkBusyRef = (0, react.useRef)(false);
			const executeHunkOp = (0, react.useCallback)(async (action, hunkIndex, path, rawDiff) => {
				if (cwd === void 0 || running || refsMode || hunkBusyRef.current) return;
				hunkBusyRef.current = true;
				const patch = buildHunkPatch(rawDiff, hunkIndex);
				if (patch === null) {
					setHunkNotice("internal error: failed to cut the hunk patch");
					return;
				}
				setHunkBusy(true);
				const payload = await hostCall("hunk-op", {
					cwd,
					path,
					patch,
					action,
					confirm: true
				});
				hunkBusyRef.current = false;
				setHunkBusy(false);
				if (payload === null) {
					setHunkNotice(t("state.hostUnavailable"));
					return;
				}
				if (!payload.ok) {
					setHunkNotice(payload.error ?? "git apply failed");
					return;
				}
				setHunkNotice(null);
				refresh();
			}, [
				cwd,
				running,
				refsMode,
				refresh,
				t
			]);
			const changeTreeMode = (0, react.useCallback)((mode) => {
				setTreeMode(mode);
				if (mode === "changes") setAllFiles(null);
			}, []);
			const changeViewMode = (0, react.useCallback)((next) => {
				if (next === "file") {
					setFileView(true);
					return;
				}
				setFileView(false);
				setViewMode(next);
				settings.set("viewMode", next);
			}, [settings]);
			const changeSearchScope = (0, react.useCallback)((scope) => {
				setSearchScope(scope);
				settings.set("searchScope", scope);
			}, [settings]);
			const toggleSearchCS = (0, react.useCallback)(() => {
				const next = !searchCS;
				setSearchCS(next);
				settings.set("searchCS", next);
			}, [settings, searchCS]);
			const toggleSearchRegex = (0, react.useCallback)(() => {
				const next = !searchRegex;
				setSearchRegex(next);
				settings.set("searchRegex", next);
			}, [settings, searchRegex]);
			const toggleWsIgnore = (0, react.useCallback)(() => {
				const next = !wsIgnore;
				setWsIgnore(next);
				settings.set("wsIgnore", next);
			}, [settings, wsIgnore]);
			const resetFileTransient = (0, react.useCallback)(() => {
				setBlameOn(false);
				setHunkNotice(null);
				setPreviewSource(false);
				setPreviewBytes({ kind: "idle" });
				setHistoryState({ kind: "closed" });
			}, []);
			const changeBase = (0, react.useCallback)((ref) => {
				setBaseRef(ref);
				setSelected(null);
				setDiffScope("all");
				resetFileTransient();
			}, [resetFileTransient]);
			const changeTarget = (0, react.useCallback)((ref) => {
				setTargetRef(ref);
				setSelected(null);
				setDiffScope("all");
				resetFileTransient();
			}, [resetFileTransient]);
			const swapEnds = (0, react.useCallback)(() => {
				setBaseRef(targetRef);
				setTargetRef(baseRef);
				setSelected(null);
				setDiffScope("all");
				resetFileTransient();
			}, [
				baseRef,
				targetRef,
				resetFileTransient
			]);
			const changeCompareMode = (0, react.useCallback)((mode) => {
				setCompareMode(mode);
				setSelected(null);
				setDiffScope("all");
				resetFileTransient();
				if (mode === "refs") {
					setBaseRef((previous) => previous ?? "HEAD");
					setTargetRef((previous) => previous ?? "HEAD");
				}
			}, [resetFileTransient]);
			const changeViewTab = (0, react.useCallback)((tab) => {
				setViewTab(tab);
				setSelected(null);
				setSelectedCommit(null);
				setGraphFile(null);
				setGraphWorktree(false);
				setGraphWorktreeFile(null);
				setGraphListCollapsed(false);
			}, []);
			const selectCommit = (0, react.useCallback)((hash) => {
				setGraphWorktree(false);
				setGraphWorktreeFile(null);
				if (selectedCommit === hash) {
					setSelectedCommit(null);
					setGraphFile(null);
					setGraphListCollapsed(false);
					return;
				}
				setSelectedCommit(hash);
				setGraphFile(null);
				setDiffScope("all");
				setGraphListCollapsed(true);
			}, [selectedCommit]);
			const jumpToCommit = (0, react.useCallback)((hash) => {
				setHistoryState({ kind: "closed" });
				const known = logState.kind === "ready" && logState.commits.some((commit) => commit.hash === hash);
				changeViewTab("graph");
				if (known) selectCommit(hash);
			}, [
				logState,
				changeViewTab,
				selectCommit
			]);
			const selectGraphWorktree = (0, react.useCallback)(() => {
				setSelectedCommit(null);
				setGraphFile(null);
				setGraphWorktree(true);
			}, []);
			const loadGraphMore = (0, react.useCallback)(() => {
				if (cwd === void 0 || logState.kind !== "ready" || graphLoadingMore) return;
				setGraphLoadingMore(true);
				hostCall("log", {
					cwd,
					skip: logState.commits.length
				}).then((payload) => {
					setGraphLoadingMore(false);
					if (payload === null || !payload.ok) return;
					setLogState((previous) => {
						if (previous.kind !== "ready") return previous;
						const seen = new Set(previous.commits.map((item) => item.hash));
						return {
							kind: "ready",
							commits: [...previous.commits, ...payload.commits.filter((item) => !seen.has(item.hash))],
							truncated: payload.truncated
						};
					});
				});
			}, [
				cwd,
				logState,
				graphLoadingMore
			]);
			const runHistory = (0, react.useCallback)(async (action, commit, mode) => {
				if (running) return t("commit.running");
				if (cwd === void 0) return t("state.hostUnavailable");
				const payload = await hostCall(action, {
					cwd,
					commit,
					mode,
					confirm: true
				});
				if (payload === null) return t("state.hostUnavailable");
				if (!payload.ok) return payload.error ?? "unknown error";
				refresh();
				return null;
			}, [
				cwd,
				running,
				refresh,
				t
			]);
			const executeMerge = (0, react.useCallback)(async (name, noFf) => {
				if (cwd === void 0) return;
				setBranchBusy(true);
				setBranchResult(null);
				const payload = await hostCall("merge", {
					cwd,
					name,
					noFf,
					confirm: true
				});
				setBranchBusy(false);
				if (payload === null) {
					setBranchResult({
						ok: false,
						text: t("state.hostUnavailable")
					});
					return;
				}
				setBranchResult({
					ok: payload.ok,
					text: payload.ok ? payload.output ?? "" : payload.error ?? "unknown error"
				});
				if (payload.ok) refresh();
			}, [
				cwd,
				refresh,
				t
			]);
			const executePull = (0, react.useCallback)(async (rebase) => {
				if (cwd === void 0) return;
				setBranchBusy(true);
				setBranchResult(null);
				const payload = await hostCall("pull", {
					cwd,
					rebase,
					confirm: true
				});
				setBranchBusy(false);
				if (payload === null) {
					setBranchResult({
						ok: false,
						text: t("state.hostUnavailable")
					});
					return;
				}
				setBranchResult({
					ok: payload.ok,
					text: payload.ok ? payload.output ?? "" : payload.error ?? "unknown error"
				});
				if (payload.ok) refresh();
			}, [
				cwd,
				refresh,
				t
			]);
			const inProgress = ready?.inProgress ?? null;
			const conflictCount = (0, react.useMemo)(() => ready === null ? 0 : ready.files.filter((file) => isUnmerged(file.x, file.y)).length, [ready]);
			const conflictFinish = (0, react.useCallback)(async (action) => {
				if (cwd === void 0 || inProgress === null) return;
				setBranchBusy(true);
				const payload = await hostCall("conflict-finish", {
					cwd,
					action,
					kind: inProgress,
					confirm: true
				});
				setBranchBusy(false);
				setConflictAbortArmed(false);
				if (payload === null || !payload.ok) {
					setBranchOpen(true);
					setBranchResult({
						ok: false,
						text: payload === null ? t("state.hostUnavailable") : payload.error ?? "unknown error"
					});
					return;
				}
				refresh();
			}, [
				cwd,
				inProgress,
				refresh,
				t
			]);
			(0, react.useEffect)(() => {
				if (inProgress === null) setConflictAbortArmed(false);
			}, [inProgress]);
			const toggleGraphList = (0, react.useCallback)(() => {
				const next = !graphListCollapsed;
				setGraphListCollapsed(next);
				settings.set("graphCollapsed", next);
			}, [settings, graphListCollapsed]);
			const selectGraphFile = (0, react.useCallback)((path) => {
				setGraphFile(path);
			}, []);
			const toggleGraphDir = (0, react.useCallback)((path) => {
				setGraphCollapsed((previous) => {
					const next = new Set(previous);
					if (next.has(path)) next.delete(path);
					else next.add(path);
					return next;
				});
			}, []);
			const onRootKeyDown = (0, react.useCallback)((event) => {
				if (event.ctrlKey || event.metaKey || event.altKey) return;
				const target = event.target;
				if (target !== null && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
				if (commitOpen || branchOpen || draftOpen || fileMenu !== null) return;
				if (event.key === "/") {
					event.preventDefault();
					searchInputRef.current?.focus();
					return;
				}
				if (event.key !== "j" && event.key !== "k") return;
				event.preventDefault();
				const forward = event.key === "j";
				if (viewTab === "graph") {
					const hashes = visibleGraph.map((row) => row.commit.hash);
					if (hashes.length === 0) return;
					const at = selectedCommit === null ? -1 : hashes.indexOf(selectedCommit);
					const next = at === -1 ? forward ? 0 : hashes.length - 1 : forward ? Math.min(hashes.length - 1, at + 1) : Math.max(0, at - 1);
					if (hashes[next] !== selectedCommit) selectCommit(hashes[next]);
					return;
				}
				const files = filterFiles(allRows ?? ready?.files ?? [], searchScope === "path" ? search : "");
				if (files.length === 0) return;
				const at = files.findIndex((file) => file.path === selected);
				const next = at === -1 ? forward ? 0 : files.length - 1 : forward ? Math.min(files.length - 1, at + 1) : Math.max(0, at - 1);
				selectFile(files[next].path);
			}, [
				viewTab,
				selected,
				selectedCommit,
				visibleGraph,
				allRows,
				ready,
				search,
				searchScope,
				selectFile,
				selectCommit,
				commitOpen,
				branchOpen,
				draftOpen,
				fileMenu
			]);
			(0, react.useEffect)(() => {
				const root = rootRef.current;
				if (root !== null && (document.activeElement === null || !root.contains(document.activeElement))) root.focus({ preventScroll: true });
			}, [viewTab, cwd]);
			const executeBranch = (0, react.useCallback)(async (action, body) => {
				if (cwd === void 0) return;
				setBranchBusy(true);
				setBranchResult(null);
				const payload = await hostCall("branch-" + action, {
					cwd,
					confirm: true,
					...body
				});
				setBranchBusy(false);
				if (payload === null) {
					setBranchResult({
						ok: false,
						text: t("state.hostUnavailable")
					});
					return;
				}
				setBranchResult({
					ok: payload.ok,
					text: payload.ok ? payload.output ?? "" : payload.error ?? "unknown error"
				});
				if (payload.ok) {
					setDeleteArmed(null);
					setRenameTarget(null);
					refresh();
				}
			}, [
				cwd,
				refresh,
				t
			]);
			const executeTrack = (0, react.useCallback)(async (remote) => {
				if (cwd === void 0) return;
				setBranchBusy(true);
				setBranchResult(null);
				const payload = await hostCall("branch-track", {
					cwd,
					remote,
					confirm: true
				});
				setBranchBusy(false);
				if (payload === null) {
					setBranchResult({
						ok: false,
						text: t("state.hostUnavailable")
					});
					return;
				}
				setBranchResult({
					ok: payload.ok,
					text: payload.ok ? payload.output ?? "" : payload.error ?? "unknown error"
				});
				if (payload.ok) refresh();
			}, [
				cwd,
				refresh,
				t
			]);
			const executeTag = (0, react.useCallback)(async (action, body) => {
				if (cwd === void 0) return;
				setBranchBusy(true);
				setBranchResult(null);
				const payload = await hostCall("tag-" + action, {
					cwd,
					confirm: true,
					...body
				});
				setBranchBusy(false);
				if (payload === null) {
					setBranchResult({
						ok: false,
						text: t("state.hostUnavailable")
					});
					return;
				}
				setBranchResult({
					ok: payload.ok,
					text: payload.ok ? payload.output ?? "" : payload.error ?? "unknown error"
				});
				if (payload.ok) {
					setTagDeleteArmed(null);
					if (action === "create") {
						setTagName("");
						setTagTarget("");
					}
					refresh();
				}
			}, [
				cwd,
				refresh,
				t
			]);
			const dismissGuide = (0, react.useCallback)(() => {
				try {
					window.localStorage.setItem("dsh-git-review.guideSeen", "1");
				} catch {}
				setGuideSeen(true);
			}, []);
			const reopenGuide = (0, react.useCallback)(() => {
				try {
					window.localStorage.removeItem("dsh-git-review.guideSeen");
				} catch {}
				setGuideSeen(false);
			}, []);
			const openFileApp = (0, react.useCallback)(async (path, app) => {
				if (cwd === void 0) return t("state.hostUnavailable");
				const payload = await hostCall("open-with", {
					cwd,
					path,
					app,
					confirm: true
				});
				if (payload === null) return t("state.hostUnavailable");
				if (!payload.ok) return payload.error ?? "unknown error";
				return null;
			}, [cwd, t]);
			const copyFilePath = (0, react.useCallback)(async (path) => {
				try {
					await navigator.clipboard.writeText(path);
					return null;
				} catch {
					return t("menu.clipboardFailed");
				}
			}, [t]);
			const copyFileName = (0, react.useCallback)(async (path) => {
				const name = path.split("/").pop() ?? path;
				try {
					await navigator.clipboard.writeText(name);
					return null;
				} catch {
					return t("menu.clipboardFailed");
				}
			}, [t]);
			const renameFile = (0, react.useCallback)(async (path, newPath) => {
				if (running) return t("commit.running");
				if (cwd === void 0) return t("state.hostUnavailable");
				const payload = await hostCall("file-op", {
					cwd,
					path,
					action: "rename",
					newPath,
					confirm: true
				});
				if (payload === null) return t("state.hostUnavailable");
				if (!payload.ok) return payload.error ?? "unknown error";
				setSelected(null);
				refresh();
				return null;
			}, [
				cwd,
				running,
				refresh,
				t
			]);
			const removeFile = (0, react.useCallback)(async (path) => {
				if (running) return t("commit.running");
				if (cwd === void 0) return t("state.hostUnavailable");
				const payload = await hostCall("file-op", {
					cwd,
					path,
					action: "delete",
					confirm: true
				});
				if (payload === null) return t("state.hostUnavailable");
				if (!payload.ok) return payload.error ?? "unknown error";
				setSelected(null);
				refresh();
				return null;
			}, [
				cwd,
				running,
				refresh,
				t
			]);
			const executeWrite = (0, react.useCallback)(async (kind) => {
				if (cwd === void 0) return;
				setWriteState({ kind: "busy" });
				const pushBody = {
					cwd,
					confirm: true
				};
				const pushCall = async () => {
					const payload = await hostCall("push", pushBody);
					if (payload === null) return {
						ok: false,
						text: t("state.hostUnavailable")
					};
					return payload.ok ? {
						ok: true,
						text: payload.output ?? ""
					} : {
						ok: false,
						text: payload.error ?? "unknown error"
					};
				};
				let outcome;
				if (kind === "push") outcome = await pushCall();
				else {
					const commitResult = await hostCall("commit", {
						cwd,
						message: commitMessage,
						mode: stageAll ? "all" : "staged",
						amend,
						confirm: true
					});
					if (commitResult === null) outcome = {
						ok: false,
						text: t("state.hostUnavailable")
					};
					else if (!commitResult.ok) outcome = {
						ok: false,
						text: commitResult.error ?? "unknown error"
					};
					else if (kind === "commit") outcome = {
						ok: true,
						text: commitResult.output ?? ""
					};
					else {
						const pushed = await pushCall();
						outcome = pushed.ok ? {
							ok: true,
							text: (commitResult.output ?? "") + "\n" + pushed.text
						} : pushed;
					}
				}
				setWriteState({
					kind: "result",
					ok: outcome.ok,
					text: outcome.text
				});
				setArmed(null);
				if (outcome.ok) {
					if (kind !== "push") setCommitMessage("");
					setAmend(false);
					refresh();
				}
			}, [
				cwd,
				commitMessage,
				stageAll,
				amend,
				refresh,
				t
			]);
			const runGitAction = (0, react.useCallback)(async (action, path) => {
				if (running) return t("commit.running");
				if (cwd === void 0) return t("state.hostUnavailable");
				const payload = await hostCall(action, {
					cwd,
					paths: [path],
					confirm: true
				});
				if (payload === null) return t("state.hostUnavailable");
				if (!payload.ok) return payload.error ?? "unknown error";
				setSelected(null);
				refresh();
				return null;
			}, [
				cwd,
				running,
				refresh,
				t
			]);
			const runConflictResolve = (0, react.useCallback)(async (side, path) => {
				if (running) return t("commit.running");
				if (cwd === void 0) return t("state.hostUnavailable");
				const payload = await hostCall("conflict-resolve", {
					cwd,
					path,
					side,
					confirm: true
				});
				if (payload === null) return t("state.hostUnavailable");
				if (!payload.ok) return payload.error ?? "unknown error";
				refresh();
				return null;
			}, [
				cwd,
				running,
				refresh,
				t
			]);
			const loadStashes = (0, react.useCallback)(() => {
				if (cwd === void 0) return;
				hostCall("stash", {
					cwd,
					action: "list"
				}).then((payload) => {
					setStashList(payload !== null && payload.ok ? payload.stashes : []);
				});
			}, [cwd]);
			const runStash = (0, react.useCallback)(async (action, index) => {
				if (cwd === void 0) return;
				setBranchBusy(true);
				setBranchResult(null);
				const payload = await hostCall("stash", {
					cwd,
					action,
					index,
					includeUntracked: stashIncludeUntracked,
					confirm: true
				});
				setBranchBusy(false);
				if (payload === null) {
					setBranchResult({
						ok: false,
						text: t("state.hostUnavailable")
					});
					return;
				}
				setBranchResult({
					ok: payload.ok,
					text: payload.ok ? payload.output ?? "" : payload.error ?? "unknown error"
				});
				if (payload.ok) {
					setStashArmed(null);
					loadStashes();
					refresh();
				}
			}, [
				cwd,
				stashIncludeUntracked,
				loadStashes,
				refresh,
				t
			]);
			const executeFetch = (0, react.useCallback)(async () => {
				if (cwd === void 0) return;
				setBranchBusy(true);
				setBranchResult(null);
				const payload = await hostCall("fetch", {
					cwd,
					confirm: true
				});
				setBranchBusy(false);
				if (payload === null) {
					setBranchResult({
						ok: false,
						text: t("state.hostUnavailable")
					});
					return;
				}
				setBranchResult({
					ok: payload.ok,
					text: payload.ok ? (payload.output ?? "").trim() === "" ? t("branch.fetchDone") : payload.output : payload.error ?? "unknown error"
				});
				if (payload.ok) refresh();
			}, [
				cwd,
				refresh,
				t
			]);
			const toggleAmend = (0, react.useCallback)((next) => {
				setAmend(next);
				if (next && cwd !== void 0 && commitMessage.trim() === "") hostCall("last-commit", { cwd }).then((payload) => {
					if (payload !== null && payload.ok && payload.message !== "") setCommitMessage((previous) => previous.trim() === "" ? payload.message : previous);
				});
			}, [cwd, commitMessage]);
			if (status.kind === "noWorkspace" || status.kind === "hostUnavailable" || status.kind === "notRepo" || status.kind === "error") return (0, react_jsx_runtime.jsx)(CenteredState, {
				t,
				status,
				onRetry: refresh
			});
			const data = ready;
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: rootRef,
				tabIndex: -1,
				onKeyDown: onRootKeyDown,
				className: review_module_css_default.root,
				"data-conversation-composer-overlay": "",
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: review_module_css_default.toolbar,
						"data-git-review-toolbar": "",
						children: [
							(0, react_jsx_runtime.jsxs)("div", {
								className: review_module_css_default.toolbarRow,
								children: [
									(0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: review_module_css_default.branchBtn,
										title: t("branch.manage"),
										ref: branchBtnRef,
										onClick: () => {
											setBranchOpen((value) => !value);
											setDeleteArmed(null);
											setRenameTarget(null);
											setTagDeleteArmed(null);
											setBranchResult(null);
											loadStashes();
										},
										children: [
											(0, react_jsx_runtime.jsx)(BranchIcon, {}),
											(0, react_jsx_runtime.jsx)("span", { children: data?.branch ?? "HEAD" }),
											data?.ahead !== void 0 && data.behind !== void 0 && data.ahead + data.behind > 0 && (0, react_jsx_runtime.jsxs)("span", {
												className: review_module_css_default.abCount,
												title: t("aheadBehind.title", {
													ahead: data.ahead,
													behind: data.behind
												}),
												children: [data.ahead > 0 ? "↑" + String(data.ahead) : "", data.behind > 0 ? "↓" + String(data.behind) : ""]
											}),
											(0, react_jsx_runtime.jsx)(PopupIcon, { open: branchOpen })
										]
									}),
									viewTab === "changes" && (0, react_jsx_runtime.jsx)("span", {
										className: review_module_css_default.tbDivider,
										"aria-hidden": "true"
									}),
									viewTab === "changes" && (0, react_jsx_runtime.jsxs)("span", {
										className: review_module_css_default.compareCluster,
										title: t("compare.pickHint"),
										children: [
											(0, react_jsx_runtime.jsx)("span", {
												className: review_module_css_default.scopeSwitch,
												role: "group",
												"aria-label": t("compare.mode"),
												children: ["worktree", "refs"].map((candidate) => (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: review_module_css_default.scopeBtn + (compareMode === candidate ? " " + review_module_css_default.scopeBtnActive : ""),
													title: t("compare." + candidate + "Hint"),
													onClick: () => {
														changeCompareMode(candidate);
													},
													children: t("compare." + candidate)
												}, candidate))
											}),
											!refsMode ? (0, react_jsx_runtime.jsxs)("span", {
												className: review_module_css_default.compareRow,
												title: t("base.label"),
												children: [
													(0, react_jsx_runtime.jsx)(RefPicker, {
														value: baseRef,
														headLabel: data?.branch ?? "HEAD",
														refs,
														commits: pickerCommits,
														placeholder: t("compare.pickBase"),
														onPick: changeBase,
														t
													}),
													(0, react_jsx_runtime.jsx)("span", {
														className: review_module_css_default.compareArrow,
														children: "→"
													}),
													(0, react_jsx_runtime.jsxs)("span", {
														className: review_module_css_default.compareFixed,
														title: t("base.worktree"),
														children: [(0, react_jsx_runtime.jsx)(FileIcon, {}), (0, react_jsx_runtime.jsx)("span", { children: t("base.worktree") })]
													})
												]
											}) : (0, react_jsx_runtime.jsxs)("span", {
												className: review_module_css_default.compareRow + " " + review_module_css_default.rangeChip,
												children: [
													(0, react_jsx_runtime.jsx)(RefPicker, {
														value: baseRef,
														headLabel: data?.branch ?? "HEAD",
														refs,
														commits: pickerCommits,
														exclude: targetRef,
														placeholder: t("compare.pickBase"),
														onPick: (value) => {
															changeBase(refsMode ? value ?? "HEAD" : value);
														},
														t
													}),
													(0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: review_module_css_default.swapBtn,
														title: t("compare.swap"),
														"aria-label": t("compare.swap"),
														onClick: swapEnds,
														children: (0, react_jsx_runtime.jsx)(SwapIcon, {})
													}),
													(0, react_jsx_runtime.jsx)(RefPicker, {
														value: targetRef,
														headLabel: data?.branch ?? "HEAD",
														refs,
														commits: pickerCommits,
														exclude: baseRef,
														placeholder: t("compare.pickTarget"),
														onPick: (value) => {
															changeTarget(value ?? "HEAD");
														},
														t
													})
												]
											}),
											data !== null && (0, react_jsx_runtime.jsx)("span", {
												className: review_module_css_default.tbDivider,
												"aria-hidden": "true"
											}),
											data !== null && (0, react_jsx_runtime.jsxs)("span", {
												className: review_module_css_default.totals,
												children: [
													(0, react_jsx_runtime.jsx)("span", {
														className: review_module_css_default.totalAdded,
														children: "+" + fmtCount(data.totals.added)
													}),
													(0, react_jsx_runtime.jsx)("span", {
														className: review_module_css_default.totalDeleted,
														children: "−" + fmtCount(data.totals.deleted)
													}),
													(0, react_jsx_runtime.jsx)("span", {
														className: review_module_css_default.fileCount,
														children: "· " + t("filesChanged", { count: data.files.length })
													})
												]
											})
										]
									}),
									(0, react_jsx_runtime.jsx)("span", {
										className: review_module_css_default.scopeSwitch,
										role: "group",
										"aria-label": t("view.label"),
										children: ["changes", "graph"].map((candidate) => (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: review_module_css_default.scopeBtn + (viewTab === candidate ? " " + review_module_css_default.scopeBtnActive : ""),
											onClick: () => {
												changeViewTab(candidate);
											},
											children: [candidate === "changes" ? (0, react_jsx_runtime.jsx)(FileIcon, {}) : (0, react_jsx_runtime.jsx)(GraphIcon, {}), (0, react_jsx_runtime.jsx)("span", { children: t("viewTab." + candidate) })]
										}, candidate))
									}),
									(0, react_jsx_runtime.jsx)("span", {
										className: review_module_css_default.searchWrap,
										children: (0, react_jsx_runtime.jsxs)("label", {
											className: review_module_css_default.searchBox,
											children: [
												viewTab === "changes" && (0, react_jsx_runtime.jsxs)("span", {
													className: review_module_css_default.searchScope,
													ref: searchOptionsRef,
													children: [(0, react_jsx_runtime.jsxs)("button", {
														type: "button",
														className: review_module_css_default.searchScopeBtn,
														title: t("search.scope"),
														"aria-haspopup": "menu",
														"aria-expanded": searchOptionsOpen,
														onClick: () => {
															setSearchOptionsOpen((value) => !value);
														},
														children: [(0, react_jsx_runtime.jsx)("span", { children: t("search.scope." + searchScope) }), (0, react_jsx_runtime.jsx)(PopupIcon, {
															size: 10,
															open: searchOptionsOpen
														})]
													}), searchOptionsOpen && (0, react_jsx_runtime.jsxs)("div", {
														className: review_module_css_default.searchOptionsPop,
														role: "menu",
														children: [
															(0, react_jsx_runtime.jsx)("div", {
																className: review_module_css_default.searchOptionsGroup,
																children: t("search.scope")
															}),
															[
																"diff",
																"content",
																"path"
															].map((candidate) => (0, react_jsx_runtime.jsxs)("button", {
																type: "button",
																className: review_module_css_default.pickerItem + (searchScope === candidate ? " " + review_module_css_default.pickerItemActive : ""),
																onClick: () => {
																	changeSearchScope(candidate);
																},
																children: [(0, react_jsx_runtime.jsx)("span", {
																	className: review_module_css_default.pickerItemName,
																	children: t("search.scope." + candidate)
																}), searchScope === candidate && (0, react_jsx_runtime.jsx)("span", {
																	className: review_module_css_default.pickerItemCheck,
																	children: (0, react_jsx_runtime.jsx)(CheckIcon, {})
																})]
															}, candidate)),
															(0, react_jsx_runtime.jsx)("div", { className: review_module_css_default.fileMenuDivider }),
															(0, react_jsx_runtime.jsx)("div", {
																className: review_module_css_default.searchOptionsGroup,
																children: t("search.matching")
															}),
															(0, react_jsx_runtime.jsxs)("button", {
																type: "button",
																className: review_module_css_default.pickerItem + (searchCS ? " " + review_module_css_default.pickerItemActive : ""),
																onClick: () => {
																	toggleSearchCS();
																},
																children: [(0, react_jsx_runtime.jsx)("span", {
																	className: review_module_css_default.pickerItemName,
																	children: t("search.caseSensitive")
																}), searchCS && (0, react_jsx_runtime.jsx)("span", {
																	className: review_module_css_default.pickerItemCheck,
																	children: (0, react_jsx_runtime.jsx)(CheckIcon, {})
																})]
															}),
															(0, react_jsx_runtime.jsxs)("button", {
																type: "button",
																className: review_module_css_default.pickerItem + (searchRegex ? " " + review_module_css_default.pickerItemActive : ""),
																onClick: () => {
																	toggleSearchRegex();
																},
																children: [(0, react_jsx_runtime.jsx)("span", {
																	className: review_module_css_default.pickerItemName,
																	children: t("search.regex")
																}), searchRegex && (0, react_jsx_runtime.jsx)("span", {
																	className: review_module_css_default.pickerItemCheck,
																	children: (0, react_jsx_runtime.jsx)(CheckIcon, {})
																})]
															})
														]
													})]
												}),
												(0, react_jsx_runtime.jsx)(SearchIcon, {}),
												(0, react_jsx_runtime.jsx)("input", {
													ref: searchInputRef,
													className: review_module_css_default.searchInput,
													value: searchDraft,
													onChange: (event) => {
														setSearchDraft(event.target.value);
													},
													onKeyDown: (event) => {
														if (event.key === "Escape") setSearchDraft("");
													},
													placeholder: viewTab === "changes" ? searchScope === "path" ? t("search.placeholderPath") : searchScope === "content" ? t("search.placeholderContent") : t("search.placeholder") : t("graph.search"),
													spellCheck: false
												}),
												viewTab === "changes" && searchScope !== "path" && search !== "" && (0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.searchMeta,
													children: searchMatches === null ? "…" : t("search.files", { count: searchMatches.size })
												}),
												viewTab === "changes" && searchCS && (0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.searchFlag,
													title: t("search.caseSensitive"),
													children: t("search.flagCS")
												}),
												viewTab === "changes" && searchRegex && (0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.searchFlag,
													title: t("search.regex"),
													children: t("search.flagRegex")
												})
											]
										})
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: review_module_css_default.iconBtn + (status.kind === "loading" ? " " + review_module_css_default.iconBtnSpinning : ""),
										onClick: refresh,
										title: t("refresh"),
										"aria-label": t("refresh"),
										children: (0, react_jsx_runtime.jsx)(RefreshIcon, {})
									}),
									(0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: review_module_css_default.iconBtn,
										disabled: useInput === void 0 || inputActions === void 0,
										title: t("comment.draftsTitle"),
										"aria-label": t("comment.draftsTitle"),
										ref: draftBtnRef,
										"aria-expanded": draftOpen,
										onClick: () => {
											setDraftOpen((value) => !value);
										},
										children: [(0, react_jsx_runtime.jsx)(CommentIcon, {}), draftList.length > 0 && (0, react_jsx_runtime.jsx)("span", {
											className: review_module_css_default.iconBtnBadge,
											children: draftList.length > 9 ? "9+" : String(draftList.length)
										})]
									}),
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: review_module_css_default.iconBtn,
										title: t("guide.reopen"),
										"aria-label": t("guide.reopen"),
										onClick: reopenGuide,
										children: (0, react_jsx_runtime.jsx)("span", {
											"aria-hidden": "true",
											children: "?"
										})
									}),
									(0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: review_module_css_default.commitToggle,
										disabled: data === null || running,
										title: running ? t("commit.running") : t("commit.title") + " · " + t("commit.commitHint"),
										ref: commitBtnRef,
										onClick: () => {
											setCommitOpen((value) => !value);
											setArmed(null);
											setAmend(false);
										},
										children: [(0, react_jsx_runtime.jsx)(CommitIcon, {}), (0, react_jsx_runtime.jsx)("span", { children: t("commit.title") })]
									})
								]
							}),
							draftOpen && useInput !== void 0 && inputActions !== void 0 && (0, react_jsx_runtime.jsx)(DraftPopover, {
								items: draftList,
								useInput,
								inputActions,
								popRef: draftPopRef,
								onRemove: (index) => {
									draftBox?.remove(index);
									setDraftList(draftBox?.list() ?? []);
								},
								onClear: () => {
									draftBox?.clear();
									setDraftList([]);
								},
								onClose: () => {
									setDraftOpen(false);
								},
								t
							}),
							commitOpen && data !== null && (0, react_jsx_runtime.jsxs)("div", {
								className: review_module_css_default.commitPop,
								ref: commitPopRef,
								children: [
									(0, react_jsx_runtime.jsx)("textarea", {
										className: review_module_css_default.commitInput,
										value: commitMessage,
										onChange: (event) => {
											setCommitMessage(event.target.value);
										},
										onKeyDown: (event) => {
											if (event.key === "Escape") setCommitOpen(false);
											if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && commitMessage.trim() !== "" && !running && writeState.kind !== "busy") executeWrite("commit");
										},
										placeholder: t("commit.message"),
										rows: 3,
										autoFocus: true
									}),
									(0, react_jsx_runtime.jsxs)("label", {
										className: review_module_css_default.commitCheck,
										children: [(0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: stageAll,
											onChange: (event) => {
												setStageAll(event.target.checked);
											}
										}), (0, react_jsx_runtime.jsx)("span", { children: t("commit.stageAll") })]
									}),
									(0, react_jsx_runtime.jsxs)("label", {
										className: review_module_css_default.commitCheck,
										children: [(0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: amend,
											onChange: (event) => {
												toggleAmend(event.target.checked);
											}
										}), (0, react_jsx_runtime.jsx)("span", { children: t("commit.amend") })]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: review_module_css_default.commitActions,
										children: [
											(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: review_module_css_default.commitBtn + (armed === "commit" ? " " + review_module_css_default.commitBtnArmed : ""),
												disabled: running || writeState.kind === "busy" || commitMessage.trim() === "",
												onClick: () => {
													if (armed === "commit") executeWrite("commit");
													else setArmed("commit");
												},
												children: armed === "commit" ? t("commit.confirmCommit") : t("commit.commit")
											}),
											(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: review_module_css_default.commitBtn + (armed === "commitPush" ? " " + review_module_css_default.commitBtnArmed : ""),
												disabled: running || writeState.kind === "busy" || commitMessage.trim() === "",
												onClick: () => {
													if (armed === "commitPush") executeWrite("commitPush");
													else setArmed("commitPush");
												},
												children: armed === "commitPush" ? t("commit.confirmCommitPush") : t("commit.commitPush")
											}),
											(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: review_module_css_default.commitBtn + (armed === "push" ? " " + review_module_css_default.commitBtnArmed : ""),
												disabled: running || writeState.kind === "busy",
												onClick: () => {
													if (armed === "push") executeWrite("push");
													else setArmed("push");
												},
												children: armed === "push" ? t("commit.confirmPush") : t("commit.push")
											})
										]
									}),
									writeState.kind === "busy" && (0, react_jsx_runtime.jsx)("div", {
										className: review_module_css_default.commitNote,
										children: t("commit.busy")
									}),
									writeState.kind === "result" && (0, react_jsx_runtime.jsx)("div", {
										className: review_module_css_default.commitNote + (writeState.ok ? "" : " " + review_module_css_default.errorText),
										children: writeState.text
									})
								]
							}),
							branchOpen && data !== null && (0, react_jsx_runtime.jsxs)("div", {
								className: review_module_css_default.branchPop,
								ref: branchPopRef,
								children: [
									(0, react_jsx_runtime.jsxs)("div", {
										className: review_module_css_default.branchFetchRow,
										children: [(0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: review_module_css_default.commitBtn,
											disabled: branchBusy || running,
											title: t("branch.pull"),
											onClick: () => {
												executePull(false);
											},
											children: t("branch.pull")
										}), (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: review_module_css_default.commitBtn,
											disabled: branchBusy || running,
											title: t("branch.fetch"),
											onClick: () => {
												executeFetch();
											},
											children: t("branch.fetch")
										})]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: review_module_css_default.branchCreateRow,
										children: [
											(0, react_jsx_runtime.jsx)("input", {
												className: review_module_css_default.branchNameInput,
												value: branchName,
												onChange: (event) => {
													setBranchName(event.target.value);
												},
												onKeyDown: (event) => {
													if (event.key === "Escape") setBranchOpen(false);
												},
												placeholder: t("branch.newName"),
												spellCheck: false
											}),
											(0, react_jsx_runtime.jsx)(RefPicker, {
												value: branchStart === "" ? null : branchStart,
												headLabel: data.branch ?? "HEAD",
												refs,
												commits: pickerCommits,
												placeholder: t("branch.fromHead"),
												onPick: (value) => {
													setBranchStart(value ?? "");
												},
												t
											}),
											(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: review_module_css_default.commitBtn,
												disabled: branchName.trim() === "" || branchBusy || running,
												onClick: () => {
													executeBranch("create", {
														name: branchName.trim(),
														startPoint: branchStart === "" ? void 0 : branchStart
													});
												},
												children: t("branch.create")
											})
										]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: review_module_css_default.branchListScroll,
										children: [
											(0, react_jsx_runtime.jsx)("div", {
												className: review_module_css_default.branchGroupLabel,
												children: t("branch.local")
											}),
											(refs ?? []).filter((ref) => ref.kind === "branch").map((ref) => {
												const isCurrent = ref.name === data.branch;
												if (renameTarget === ref.name) return (0, react_jsx_runtime.jsxs)("div", {
													className: review_module_css_default.branchRow,
													children: [
														(0, react_jsx_runtime.jsx)("input", {
															className: review_module_css_default.branchNameInput,
															value: renameValue,
															onChange: (event) => {
																setRenameValue(event.target.value);
															},
															onKeyDown: (event) => {
																if (event.key === "Enter" && renameValue.trim() !== "" && renameValue.trim() !== ref.name) executeBranch("rename", {
																	name: ref.name,
																	newName: renameValue.trim()
																});
																if (event.key === "Escape") setRenameTarget(null);
															},
															autoFocus: true,
															spellCheck: false
														}),
														(0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: review_module_css_default.branchIconBtn,
															disabled: branchBusy || renameValue.trim() === "" || renameValue.trim() === ref.name,
															onClick: () => {
																executeBranch("rename", {
																	name: ref.name,
																	newName: renameValue.trim()
																});
															},
															children: "✓"
														}),
														(0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: review_module_css_default.branchIconBtn,
															onClick: () => {
																setRenameTarget(null);
															},
															children: "✕"
														})
													]
												}, ref.name);
												return (0, react_jsx_runtime.jsxs)("div", {
													className: review_module_css_default.branchRow + (isCurrent ? " " + review_module_css_default.branchRowCurrent : ""),
													children: [
														isCurrent && (0, react_jsx_runtime.jsx)("span", {
															className: review_module_css_default.branchCurrentMark,
															title: t("branch.current"),
															children: "✓"
														}),
														(0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: review_module_css_default.branchNameBtn,
															disabled: isCurrent || branchBusy || running,
															title: isCurrent ? t("branch.current") : t("branch.switch"),
															onClick: () => {
																executeBranch("switch", { name: ref.name });
															},
															children: ref.name
														}),
														(0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: review_module_css_default.branchIconBtn,
															title: t("branch.merge"),
															disabled: isCurrent || branchBusy || running,
															onClick: () => {
																executeMerge(ref.name, false);
															},
															children: "⇥"
														}),
														(0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: review_module_css_default.branchIconBtn,
															title: t("branch.rename"),
															onClick: () => {
																setRenameTarget(ref.name);
																setRenameValue(ref.name);
															},
															children: "✎"
														}),
														deleteArmed === ref.name ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: review_module_css_default.branchIconBtn + " " + review_module_css_default.branchDanger,
															disabled: branchBusy || running,
															title: t("branch.confirmDelete"),
															onClick: () => {
																executeBranch("delete", {
																	name: ref.name,
																	force: false
																});
															},
															children: t("branch.confirmDelete")
														}), (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: review_module_css_default.branchIconBtn + " " + review_module_css_default.branchDanger,
															disabled: branchBusy || running,
															title: t("branch.forceDelete"),
															onClick: () => {
																executeBranch("delete", {
																	name: ref.name,
																	force: true
																});
															},
															children: t("branch.forceDelete")
														})] }) : (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: review_module_css_default.branchIconBtn + " " + review_module_css_default.branchDanger,
															disabled: isCurrent || branchBusy || running,
															title: t("branch.delete"),
															onClick: () => {
																setDeleteArmed(ref.name);
															},
															children: "✕"
														})
													]
												}, ref.name);
											}),
											(refs ?? []).some((ref) => ref.kind === "remote") && (0, react_jsx_runtime.jsxs)("details", {
												className: review_module_css_default.branchRemoteDetails,
												children: [(0, react_jsx_runtime.jsx)("summary", { children: t("branch.remote") }), (refs ?? []).filter((ref) => ref.kind === "remote").map((ref) => (0, react_jsx_runtime.jsxs)("div", {
													className: review_module_css_default.branchRow + " " + review_module_css_default.branchRowRemote,
													children: [(0, react_jsx_runtime.jsx)("span", {
														className: review_module_css_default.branchNameBtn,
														title: ref.name,
														children: ref.name
													}), (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: review_module_css_default.branchIconBtn,
														disabled: branchBusy || running,
														title: t("branch.trackHint"),
														onClick: () => {
															executeTrack(ref.name);
														},
														children: t("branch.track")
													})]
												}, ref.name))]
											}),
											(0, react_jsx_runtime.jsx)("div", {
												className: review_module_css_default.branchGroupLabel,
												children: t("tag.title")
											}),
											(0, react_jsx_runtime.jsxs)("div", {
												className: review_module_css_default.branchCreateRow,
												children: [
													(0, react_jsx_runtime.jsx)("input", {
														className: review_module_css_default.branchNameInput,
														value: tagName,
														onChange: (event) => {
															setTagName(event.target.value);
														},
														onKeyDown: (event) => {
															if (event.key === "Escape") setBranchOpen(false);
														},
														placeholder: t("tag.newName"),
														spellCheck: false
													}),
													(0, react_jsx_runtime.jsx)(RefPicker, {
														value: tagTarget === "" ? null : tagTarget,
														headLabel: data.branch ?? "HEAD",
														refs,
														commits: pickerCommits,
														placeholder: t("tag.fromTarget"),
														onPick: (value) => {
															setTagTarget(value ?? "");
														},
														t
													}),
													(0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: review_module_css_default.commitBtn,
														disabled: tagName.trim() === "" || branchBusy || running,
														onClick: () => {
															executeTag("create", {
																name: tagName.trim(),
																target: tagTarget === "" ? void 0 : tagTarget
															});
														},
														children: t("tag.create")
													})
												]
											}),
											(0, react_jsx_runtime.jsx)("div", {
												className: review_module_css_default.branchListScroll,
												children: (refs ?? []).filter((ref) => ref.kind === "tag").length === 0 ? (0, react_jsx_runtime.jsx)("div", {
													className: review_module_css_default.draftEmpty,
													children: t("tag.empty")
												}) : (refs ?? []).filter((ref) => ref.kind === "tag").map((ref) => (0, react_jsx_runtime.jsxs)("div", {
													className: review_module_css_default.branchRow,
													children: [
														(0, react_jsx_runtime.jsx)("span", {
															className: review_module_css_default.branchNameBtn,
															title: ref.name,
															children: ref.name
														}),
														(0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: review_module_css_default.branchIconBtn,
															disabled: branchBusy || running,
															title: t("tag.push"),
															onClick: () => {
																executeTag("push", { name: ref.name });
															},
															children: t("tag.push")
														}),
														tagDeleteArmed === ref.name ? (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: review_module_css_default.branchIconBtn + " " + review_module_css_default.branchDanger,
															disabled: branchBusy || running,
															title: t("tag.confirmDelete"),
															onClick: () => {
																executeTag("delete", { name: ref.name });
															},
															children: t("tag.confirmDelete")
														}) : (0, react_jsx_runtime.jsx)("button", {
															type: "button",
															className: review_module_css_default.branchIconBtn + " " + review_module_css_default.branchDanger,
															disabled: branchBusy || running,
															title: t("tag.delete"),
															onClick: () => {
																setTagDeleteArmed(ref.name);
															},
															children: "✕"
														})
													]
												}, ref.name))
											})
										]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: review_module_css_default.stashSection,
										children: [
											(0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: review_module_css_default.stashToggle,
												onClick: () => {
													setStashOpen((value) => !value);
													if (!stashOpen) loadStashes();
												},
												children: [(0, react_jsx_runtime.jsx)(ChevronIcon, {
													size: 10,
													rotated: stashOpen
												}), (0, react_jsx_runtime.jsx)("span", { children: t("stash.title") })]
											}),
											(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: review_module_css_default.commitBtn,
												disabled: branchBusy || running,
												title: t("stash.push"),
												onClick: () => {
													runStash("push");
												},
												children: t("stash.push")
											}),
											(0, react_jsx_runtime.jsxs)("label", {
												className: review_module_css_default.commitCheck,
												children: [(0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: stashIncludeUntracked,
													onChange: (event) => {
														setStashIncludeUntracked(event.target.checked);
													}
												}), (0, react_jsx_runtime.jsx)("span", { children: t("stash.includeUntracked") })]
											})
										]
									}),
									stashOpen && (0, react_jsx_runtime.jsx)("div", {
										className: review_module_css_default.stashList,
										children: (stashList ?? []).length === 0 ? (0, react_jsx_runtime.jsx)("div", {
											className: review_module_css_default.draftEmpty,
											children: t("stash.empty")
										}) : (stashList ?? []).map((entry) => (0, react_jsx_runtime.jsxs)("div", {
											className: review_module_css_default.stashRow,
											children: [(0, react_jsx_runtime.jsxs)("div", {
												className: review_module_css_default.stashRowText,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.draftRowPath,
													children: "stash@{" + String(entry.index) + "}"
												}), (0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.draftRowBody,
													children: entry.subject
												})]
											}), stashArmed === entry.index ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: review_module_css_default.branchIconBtn + " " + review_module_css_default.branchDanger,
												disabled: branchBusy || running,
												onClick: () => {
													runStash("drop", entry.index);
												},
												children: t("stash.confirmDrop")
											}), (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: review_module_css_default.branchIconBtn,
												onClick: () => {
													setStashArmed(null);
												},
												children: "✕"
											})] }) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
												(0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: review_module_css_default.branchIconBtn,
													disabled: branchBusy || running,
													onClick: () => {
														runStash("apply", entry.index);
													},
													children: t("stash.apply")
												}),
												(0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: review_module_css_default.branchIconBtn,
													disabled: branchBusy || running,
													onClick: () => {
														runStash("pop", entry.index);
													},
													children: t("stash.pop")
												}),
												(0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: review_module_css_default.branchIconBtn + " " + review_module_css_default.branchDanger,
													disabled: branchBusy || running,
													title: t("stash.drop"),
													onClick: () => {
														setStashArmed(entry.index);
													},
													children: "✕"
												})
											] })]
										}, entry.index))
									}),
									branchBusy && (0, react_jsx_runtime.jsx)("div", {
										className: review_module_css_default.commitNote,
										children: t("branch.busy")
									}),
									branchResult !== null && (0, react_jsx_runtime.jsx)("div", {
										className: review_module_css_default.commitNote + (branchResult.ok ? "" : " " + review_module_css_default.errorText),
										children: branchResult.text
									})
								]
							})
						]
					}),
					!guideSeen && (0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.guideBubble,
						role: "status",
						children: [
							(0, react_jsx_runtime.jsx)("div", {
								className: review_module_css_default.guideTitle,
								children: t("guide.title")
							}),
							(0, react_jsx_runtime.jsxs)("ul", {
								className: review_module_css_default.guideList,
								children: [
									(0, react_jsx_runtime.jsx)("li", { children: t("guide.step1") }),
									(0, react_jsx_runtime.jsx)("li", { children: t("guide.step2") }),
									(0, react_jsx_runtime.jsx)("li", { children: t("guide.step3") })
								]
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.commitBtn,
								onClick: dismissGuide,
								children: t("guide.dismiss")
							})
						]
					}),
					inProgress !== null && (0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.conflictBar,
						"data-git-review-conflict": "",
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.conflictText,
								children: t("conflict.inProgress", {
									kind: t("conflict.kind." + inProgress),
									count: conflictCount
								})
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.commitBtn,
								disabled: branchBusy || running,
								onClick: () => {
									conflictFinish("continue");
								},
								children: t("conflict.continue", { kind: t("conflict.kind." + inProgress) })
							}),
							conflictAbortArmed ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.commitBtn + " " + review_module_css_default.branchDanger,
								disabled: branchBusy || running,
								onClick: () => {
									conflictFinish("abort");
								},
								children: t("conflict.abortConfirm")
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.commitBtn,
								onClick: () => {
									setConflictAbortArmed(false);
								},
								children: t("menu.cancel")
							})] }) : (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.commitBtn + " " + review_module_css_default.branchDanger,
								disabled: branchBusy || running,
								onClick: () => {
									setConflictAbortArmed(true);
								},
								children: t("conflict.abort", { kind: t("conflict.kind." + inProgress) })
							})
						]
					}),
					commitMenu !== null && (0, react_jsx_runtime.jsx)(CommitMenu, {
						state: commitMenu,
						running,
						onClose: () => {
							setCommitMenu(null);
						},
						run: runHistory,
						t
					}),
					fileMenu !== null && (0, react_jsx_runtime.jsx)(FileMenu, {
						state: fileMenu,
						apps: openApps,
						writable: !running,
						refsMode: refsMode || viewTab === "graph",
						useInput,
						inputActions,
						onClose: () => {
							setFileMenu(null);
						},
						openApp: openFileApp,
						copyPath: copyFilePath,
						copyName: copyFileName,
						rename: renameFile,
						remove: removeFile,
						gitAction: !refsMode && viewTab === "changes" ? runGitAction : void 0,
						conflictResolve: runConflictResolve,
						t
					}, fileMenu.path),
					historyState.kind === "open" && (0, react_jsx_runtime.jsxs)("div", {
						ref: historyPopRef,
						className: review_module_css_default.historyPop,
						style: {
							top: historyState.y,
							left: Math.max(8, historyState.x - 340)
						},
						onClick: (event) => {
							event.stopPropagation();
						},
						children: [(0, react_jsx_runtime.jsx)("div", {
							className: review_module_css_default.pickerGroupLabel,
							children: t("history.title")
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: review_module_css_default.historyScroll,
							children: [
								historyState.commits.length === 0 && (0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.pickerEmpty,
									children: t("history.empty")
								}),
								historyState.commits.map((commit) => {
									const known = logState.kind === "ready" && logState.commits.some((item) => item.hash === commit.hash);
									return (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: review_module_css_default.pickerItem,
										title: known ? t("history.jumpHint") : t("history.unknownHint"),
										onClick: () => {
											jumpToCommit(commit.hash);
										},
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: review_module_css_default.pickerItemName,
											children: commit.subject
										}), (0, react_jsx_runtime.jsx)("span", {
											className: review_module_css_default.pickerItemMeta,
											children: commit.hash.slice(0, 7) + " · " + fmtGraphDate(commit.timestamp)
										})]
									}, commit.hash);
								}),
								historyState.truncated && (0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.pickerEmpty,
									children: t("history.truncated")
								})
							]
						})]
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.body,
						children: viewTab === "graph" ? (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("section", {
							className: review_module_css_default.graphList + (graphListCollapsed ? " " + review_module_css_default.graphListNarrow : ""),
							"data-git-review-graph": "",
							children: [
								(0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.graphToggleRow,
									children: (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: review_module_css_default.graphToggle,
										title: graphListCollapsed ? t("graph.expandList") : t("graph.collapseList"),
										onClick: toggleGraphList,
										children: graphListCollapsed ? "▸" : "◂"
									})
								}),
								logState.kind === "loading" && (0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.paneNotice,
									children: t("graph.loading")
								}),
								logState.kind === "failed" && (0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.paneNotice + " " + review_module_css_default.errorText,
									children: logState.message
								}),
								logState.kind === "ready" && graphCommits.length === 0 && (0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.paneNotice,
									children: t("graph.empty")
								}),
								logState.kind === "ready" && graphCommits.length > 0 && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [logState.truncated && (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: review_module_css_default.gapBar,
									disabled: graphLoadingMore,
									onClick: loadGraphMore,
									children: graphLoadingMore ? t("graph.loading") : t("graph.loadMore", { count: graphCommits.length })
								}), visibleGraph.length === 0 ? (0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.paneNotice,
									children: t("graph.noMatches")
								}) : (0, react_jsx_runtime.jsx)(CommitGraph, {
									commits: visibleGraph.map((row) => row.commit),
									lanes: visibleGraph.map((row) => row.lane),
									selected: selectedCommit,
									onSelect: selectCommit,
									collapsed: graphListCollapsed,
									worktree: refsMode === false && ready !== null && ready.files.length > 0 ? { files: ready.files.length } : null,
									worktreeSelected: graphWorktree,
									onSelectWorktree: selectGraphWorktree,
									onCommitMenu: (hash, subject, x, y) => {
										setCommitMenu({
											hash,
											subject,
											x,
											y
										});
									},
									t
								})] })
							]
						}), (0, react_jsx_runtime.jsx)("main", {
							className: review_module_css_default.mainPane,
							children: graphWorktree ? (0, react_jsx_runtime.jsxs)("div", {
								className: review_module_css_default.commitDetail,
								"data-git-review-diff": "",
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.commitInfo,
									children: (0, react_jsx_runtime.jsxs)("div", {
										className: review_module_css_default.commitInfoTop,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: review_module_css_default.commitInfoLabel,
											children: t("graph.col.subject")
										}), (0, react_jsx_runtime.jsxs)("div", {
											className: review_module_css_default.commitInfoSubjectArea,
											children: [(0, react_jsx_runtime.jsx)("span", {
												className: review_module_css_default.commitInfoSubject,
												children: t("graph.worktree", { count: ready?.files.length ?? 0 })
											}), ready !== null && (0, react_jsx_runtime.jsxs)("span", {
												className: review_module_css_default.totals,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.totalAdded,
													children: "+" + fmtCount(ready.totals.added)
												}), (0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.totalDeleted,
													children: "−" + fmtCount(ready.totals.deleted)
												})]
											})]
										})]
									})
								}), (0, react_jsx_runtime.jsxs)("div", {
									className: review_module_css_default.commitSplit,
									children: [(0, react_jsx_runtime.jsx)("div", {
										className: review_module_css_default.commitTreePanel,
										"data-git-review-tree": "",
										children: ready === null || ready.files.length === 0 ? (0, react_jsx_runtime.jsx)("div", {
											className: review_module_css_default.paneNotice,
											children: t("tree.noChanges")
										}) : (0, react_jsx_runtime.jsx)(TreePanel, {
											files: ready.files,
											selected: graphWorktreeFile,
											onSelect: setGraphWorktreeFile,
											filter: "",
											onFilterChange: () => {},
											collapsed: graphCollapsed,
											onToggleDir: toggleGraphDir,
											mode: "changes",
											onModeChange: () => {},
											showModeRow: false,
											showFilter: false,
											listFailed: false,
											onFileMenu: (path, x, y) => {
												setFileMenu({
													path,
													x,
													y
												});
											},
											t
										})
									}), (0, react_jsx_runtime.jsx)("div", {
										className: review_module_css_default.commitDiffArea,
										children: graphWorktreeFile !== null && diff.kind !== "idle" && (0, react_jsx_runtime.jsx)(DiffPane, {
											file: ready?.files.find((item) => item.path === graphWorktreeFile) ?? {
												path: graphWorktreeFile,
												x: "?",
												y: "?",
												added: 0,
												deleted: 0,
												binary: false,
												untracked: false
											},
											diff: diff.kind === "text" ? diff.diff : diff.kind === "content" ? "" : "",
											truncated: diff.kind === "text" && diff.truncated,
											loading: diff.kind === "loading",
											binary: diff.kind === "binary",
											size: diff.kind === "binary" || diff.kind === "content" ? diff.size : 0,
											full: diffFull,
											onToggleFull: () => {
												setDiffFull((value) => !value);
											},
											scope: diffScope,
											onScopeChange: setDiffScope,
											view: effectiveView,
											onViewChange: changeViewMode,
											showViewSwitch: true,
											wsIgnore,
											syntaxHighlight,
											onToggleWs: toggleWsIgnore,
											search: searchSpec,
											baseActive: false,
											useInput,
											inputActions,
											onDraftAdd: addDraft,
											t
										})
									})]
								})]
							}) : selectedCommit === null || commitInfo === null ? (0, react_jsx_runtime.jsxs)("div", {
								className: review_module_css_default.emptyState,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.emptyTitle,
									children: t("graph.selectCommit")
								}), (0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.emptyHint,
									children: t("graph.selectHint")
								})]
							}) : (0, react_jsx_runtime.jsxs)("div", {
								className: review_module_css_default.commitDetail,
								"data-git-review-diff": "",
								children: [(0, react_jsx_runtime.jsxs)("div", {
									className: review_module_css_default.commitInfo,
									children: [
										(0, react_jsx_runtime.jsxs)("div", {
											className: review_module_css_default.commitInfoTop,
											children: [
												(0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: review_module_css_default.infoToggle,
													"aria-expanded": infoOpenHash === commitInfo.hash,
													title: infoOpenHash === commitInfo.hash ? t("graph.detailCollapse") : t("graph.detailExpand"),
													"aria-label": infoOpenHash === commitInfo.hash ? t("graph.detailCollapse") : t("graph.detailExpand"),
													onClick: () => {
														setInfoOpenHash((current) => current === commitInfo.hash ? null : commitInfo.hash);
													},
													children: (0, react_jsx_runtime.jsx)("span", {
														className: review_module_css_default.infoToggleIcon + (infoOpenHash === commitInfo.hash ? " " + review_module_css_default.infoToggleOpen : ""),
														children: (0, react_jsx_runtime.jsx)(ChevronIcon, { size: 12 })
													})
												}),
												(0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.commitInfoLabel,
													children: t("graph.col.subject")
												}),
												(0, react_jsx_runtime.jsxs)("div", {
													className: review_module_css_default.commitInfoSubjectArea,
													children: [(0, react_jsx_runtime.jsx)("span", {
														className: review_module_css_default.commitInfoSubject,
														children: commitInfo.subject
													}), commitInfo.refs.map((ref) => (0, react_jsx_runtime.jsx)("span", {
														className: ref.name === "HEAD" ? review_module_css_default.refBadgeHeadState : ref.kind === "head" ? review_module_css_default.refBadgeHead : ref.kind === "tag" ? review_module_css_default.refBadgeTag : review_module_css_default.refBadgeOther,
														children: ref.name
													}, ref.kind + ":" + ref.name))]
												}),
												commitTotals !== null && commitFiles !== null && (0, react_jsx_runtime.jsxs)("span", {
													className: review_module_css_default.commitStats,
													children: [
														(0, react_jsx_runtime.jsx)("span", {
															className: review_module_css_default.totalAdded,
															children: "+" + fmtCount(commitTotals.added)
														}),
														(0, react_jsx_runtime.jsx)("span", {
															className: review_module_css_default.totalDeleted,
															children: "−" + fmtCount(commitTotals.deleted)
														}),
														(0, react_jsx_runtime.jsx)("span", {
															className: review_module_css_default.fileCount,
															children: "· " + t("graph.filesCount", { count: commitFiles.length })
														})
													]
												})
											]
										}),
										infoOpenHash === commitInfo.hash && commitInfo.body !== "" && (0, react_jsx_runtime.jsx)("div", {
											className: review_module_css_default.commitBody,
											children: commitInfo.body
										}),
										(0, react_jsx_runtime.jsxs)("div", {
											className: review_module_css_default.commitActions,
											children: [
												(0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: review_module_css_default.toolBtn,
													disabled: running,
													title: t("history.reset"),
													onClick: (event) => {
														const r = event.currentTarget.getBoundingClientRect();
														setCommitMenu({
															hash: commitInfo.hash,
															subject: commitInfo.subject,
															x: r.left,
															y: r.bottom
														});
													},
													children: t("history.reset")
												}),
												(0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: review_module_css_default.toolBtn,
													disabled: running,
													title: t("history.revert"),
													onClick: () => {
														runHistory("revert", commitInfo.hash);
													},
													children: t("history.revert")
												}),
												(0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: review_module_css_default.toolBtn,
													disabled: running,
													title: t("history.cherryPick"),
													onClick: () => {
														runHistory("cherry-pick", commitInfo.hash);
													},
													children: t("history.cherryPick")
												})
											]
										}),
										infoOpenHash === commitInfo.hash && (0, react_jsx_runtime.jsxs)("div", {
											className: review_module_css_default.commitInfoGrid,
											children: [
												(0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.commitInfoLabel,
													children: t("graph.col.commit")
												}),
												(0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: review_module_css_default.commitHashBtn,
													title: copiedHash ? t("graph.copied") : t("graph.copyHash"),
													onClick: copyCommitHash,
													children: commitInfo.hash
												}),
												(0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.commitInfoLabel,
													children: t("graph.field.author")
												}),
												(0, react_jsx_runtime.jsx)("span", { children: commitInfo.authorName }),
												(0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.commitInfoLabel,
													children: t("graph.col.date")
												}),
												(0, react_jsx_runtime.jsx)("span", { children: fmtGraphDate(commitInfo.timestamp) }),
												(0, react_jsx_runtime.jsx)("span", {
													className: review_module_css_default.commitInfoLabel,
													children: t("graph.parent")
												}),
												(0, react_jsx_runtime.jsx)("span", { children: commitInfo.parents.length === 0 ? "—" : commitInfo.parents.map((parent) => parent.slice(0, 7)).join(", ") })
											]
										})
									]
								}), (0, react_jsx_runtime.jsxs)("div", {
									className: review_module_css_default.commitSplit,
									children: [(0, react_jsx_runtime.jsx)("div", {
										className: review_module_css_default.commitTreePanel,
										"data-git-review-tree": "",
										children: commitFiles === null ? (0, react_jsx_runtime.jsx)("div", {
											className: review_module_css_default.paneNotice,
											children: t("graph.loading")
										}) : commitFiles.length === 0 ? (0, react_jsx_runtime.jsx)("div", {
											className: review_module_css_default.paneNotice,
											children: t("graph.noFiles")
										}) : (0, react_jsx_runtime.jsx)(TreePanel, {
											files: commitFiles,
											selected: graphFile,
											onSelect: selectGraphFile,
											filter: graphFilter,
											onFilterChange: setGraphFilter,
											collapsed: graphCollapsed,
											onToggleDir: toggleGraphDir,
											mode: "changes",
											onModeChange: () => {},
											showModeRow: false,
											listFailed: false,
											onFileMenu: (path, x, y) => {
												setFileMenu({
													path,
													x,
													y
												});
											},
											t
										})
									}), (0, react_jsx_runtime.jsx)("div", {
										className: review_module_css_default.commitDiffArea,
										children: graphFileInfo !== null && diff.kind !== "idle" && (0, react_jsx_runtime.jsx)(DiffPane, {
											file: graphFileInfo,
											diff: diff.kind === "text" ? diff.diff : "",
											truncated: diff.kind === "text" && diff.truncated,
											loading: diff.kind === "loading",
											binary: diff.kind === "binary",
											size: diff.kind === "binary" ? diff.size : 0,
											full: diffFull,
											onToggleFull: () => {
												setDiffFull((value) => !value);
											},
											scope: diffScope,
											onScopeChange: setDiffScope,
											view: viewMode,
											onViewChange: changeViewMode,
											showViewSwitch: true,
											allowFileView: false,
											wsIgnore,
											syntaxHighlight,
											onToggleWs: toggleWsIgnore,
											search: searchSpec,
											baseActive: true,
											useInput,
											inputActions,
											onDraftAdd: addDraft,
											t
										})
									})]
								})]
							})
						})] }) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("main", {
							className: review_module_css_default.mainPane,
							children: selected === null || selectedFile === null || diff.kind === "idle" ? (0, react_jsx_runtime.jsxs)("div", {
								className: review_module_css_default.emptyState,
								children: [(0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.emptyTitle,
									children: refsMode && !rangeReady ? t("compare.refs") : t("empty.title")
								}), (0, react_jsx_runtime.jsx)("div", {
									className: review_module_css_default.emptyHint,
									children: refsMode && !rangeReady ? t("compare.pickHint") : t("empty.hint")
								})]
							}) : diff.kind === "failed" ? (0, react_jsx_runtime.jsx)("div", {
								className: review_module_css_default.paneNotice + " " + review_module_css_default.errorText,
								children: diff.message
							}) : effectiveView === "file" ? showPreview && previewKind !== null ? (0, react_jsx_runtime.jsx)(PreviewPane, {
								file: selectedFile,
								kind: previewKind,
								text: previewKind === "markdown" ? mdText : diff.kind === "content" ? diff.content : "",
								textLoading: diff.kind === "loading",
								textTruncated: previewKind === "markdown" && diff.kind === "content" && diff.truncated,
								dataUrl: previewDataUrl,
								bytesFailed: previewBytesFailed,
								bytesTruncated: previewBytes.kind === "ready" && previewBytes.truncated,
								onShowSource: () => {
									setPreviewSource(true);
								},
								t
							}) : (0, react_jsx_runtime.jsx)(FilePane, {
								file: selectedFile,
								content: diff.kind === "content" ? diff.content : "",
								truncated: diff.kind === "content" && diff.truncated,
								binary: diff.kind === "binary",
								size: diff.kind === "binary" || diff.kind === "content" ? diff.size : 0,
								loading: diff.kind === "loading",
								canShowDiff: selectedFile.unchanged !== true,
								view: effectiveView,
								onViewChange: changeViewMode,
								syntaxHighlight,
								search: searchSpec,
								blameOn,
								onToggleBlame: () => {
									setBlameOn((value) => !value);
								},
								blameState,
								previewAvailable,
								onShowPreview: () => {
									setPreviewSource(false);
								},
								t
							}) : (0, react_jsx_runtime.jsx)(DiffPane, {
								file: selectedFile,
								diff: diff.kind === "text" ? diff.diff : "",
								truncated: diff.kind === "text" && diff.truncated,
								loading: diff.kind === "loading",
								binary: diff.kind === "binary",
								size: diff.kind === "binary" ? diff.size : 0,
								full: diffFull,
								onToggleFull: () => {
									setDiffFull((value) => !value);
								},
								scope: diffScope,
								onScopeChange: setDiffScope,
								view: effectiveView,
								onViewChange: changeViewMode,
								showViewSwitch: true,
								wsIgnore,
								syntaxHighlight,
								onToggleWs: toggleWsIgnore,
								search: searchSpec,
								baseActive: baseRef !== null || refsMode,
								hunkOps: !refsMode && baseRef === null && !running && selectedFile.untracked !== true ? diffScope === "staged" ? "unstage" : diffScope === "unstaged" ? "stage-revert" : void 0 : void 0,
								onHunkOp: (action, hi) => {
									executeHunkOp(action, hi, selectedFile.path, diff.kind === "text" ? diff.diff : "");
								},
								hunkBusy,
								onFileHistory: openFileHistory,
								historyLoading: historyState.kind === "loading",
								hunkNotice,
								useInput,
								inputActions,
								onDraftAdd: addDraft,
								t
							})
						}), data !== null && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.treeDivider,
							title: t("tree.resizeHint"),
							onMouseDown: startTreeResize,
							onDoubleClick: () => {
								setTreeWidth(null);
								try {
									localStorage.removeItem("dsh-git-review.treeWidth");
								} catch {}
							}
						}), (0, react_jsx_runtime.jsx)(TreePanel, {
							width: treeWidth ?? void 0,
							files: allRows ?? data.files,
							selected,
							onSelect: selectFile,
							filter: searchScope === "path" ? search : "",
							onFilterChange: () => {},
							collapsed,
							onToggleDir: toggleDir,
							mode: treeMode,
							onModeChange: changeTreeMode,
							showModeRow: !refsMode,
							showFilter: false,
							listFailed: allFilesFailed,
							matchCounts: searchMatches ?? void 0,
							viewedHas: refsMode ? void 0 : viewedHas,
							onToggleViewed: refsMode ? void 0 : toggleViewed,
							pendingCount,
							onFileMenu: (path, x, y, file) => {
								setFileMenu({
									path,
									x,
									y,
									git: {
										staged: !file.untracked && file.x !== " ",
										unstaged: file.y !== " ",
										untracked: file.untracked,
										conflicted: isUnmerged(file.x, file.y)
									}
								});
							},
							t
						})] })] })
					})
				]
			});
		}
		function CenteredState({ status, t, onRetry }) {
			if (status.kind === "notRepo") return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.root + " " + review_module_css_default.centered,
				"data-conversation-composer-overlay": "",
				children: [(0, react_jsx_runtime.jsx)("div", {
					className: review_module_css_default.emptyTitle,
					children: t("state.notRepo.title")
				}), (0, react_jsx_runtime.jsx)("div", {
					className: review_module_css_default.emptyHint,
					children: t("state.notRepo.hint")
				})]
			});
			const message = status.kind === "noWorkspace" ? t("state.noWorkspace") : status.kind === "hostUnavailable" ? t("state.hostUnavailable") : t("state.error") + ": " + status.message;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.root + " " + review_module_css_default.centered,
				"data-conversation-composer-overlay": "",
				children: [(0, react_jsx_runtime.jsx)("div", {
					className: review_module_css_default.emptyTitle,
					children: message
				}), (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: review_module_css_default.toolBtn,
					onClick: onRetry,
					children: [(0, react_jsx_runtime.jsx)(RefreshIcon, {}), (0, react_jsx_runtime.jsx)("span", { children: t("refresh") })]
				})]
			});
		}
		function DraftPopover({ items, useInput, inputActions, popRef, onRemove, onClear, onClose, t }) {
			const draft = useInput((s) => s.draft);
			const sendAll = () => {
				if (items.length === 0) return;
				const block = items.map((entry) => entry.path + ":" + entry.line + " — " + entry.text).join("\n\n");
				const current = draft.replace(/\s+$/, "");
				inputActions.setDraft(current === "" ? block : current + "\n\n" + block);
				onClear();
				onClose();
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.commitPop + " " + review_module_css_default.draftPop,
				ref: popRef,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: review_module_css_default.draftHead,
						children: [(0, react_jsx_runtime.jsx)("span", { children: t("comment.draftsTitle") }), items.length > 0 && (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: review_module_css_default.draftClear,
							onClick: onClear,
							children: t("comment.clearDrafts")
						})]
					}),
					items.length === 0 ? (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.draftEmpty,
						children: t("comment.emptyDrafts")
					}) : (0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.draftList,
						children: items.map((entry, index) => (0, react_jsx_runtime.jsxs)("div", {
							className: review_module_css_default.draftRow,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: review_module_css_default.draftRowText,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.draftRowPath,
									children: entry.path + ":" + entry.line
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.draftRowBody,
									children: entry.text
								})]
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: review_module_css_default.branchIconBtn + " " + review_module_css_default.branchDanger,
								title: t("comment.removeDraft"),
								"aria-label": t("comment.removeDraft"),
								onClick: () => {
									onRemove(index);
								},
								children: "✕"
							})]
						}, entry.path + ":" + entry.line + ":" + index))
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: review_module_css_default.commitActions,
						children: (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: review_module_css_default.commitBtn,
							disabled: items.length === 0,
							onClick: sendAll,
							children: t("comment.sendAll")
						})
					})
				]
			});
		}
		//#endregion
		//#region src/client/settings-card.tsx
		function PrefRow({ label, hint, value, options, disabled, onChange }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: review_module_css_default.pluginPrefRow,
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: review_module_css_default.pluginPrefText,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.pluginPrefLabel,
						children: label
					}), (0, react_jsx_runtime.jsx)("span", {
						className: review_module_css_default.pluginPrefHint,
						children: hint
					})]
				}), (0, react_jsx_runtime.jsx)("span", {
					className: review_module_css_default.pluginPrefGroup,
					role: "group",
					"aria-label": label,
					children: options.map((option) => (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						disabled,
						className: review_module_css_default.pluginPrefBtn + (value === option.key ? " " + review_module_css_default.pluginPrefBtnActive : ""),
						"aria-pressed": value === option.key,
						onClick: () => {
							onChange(option.key);
						},
						children: option.label
					}, option.key))
				})]
			});
		}
		function SettingsCard({ t, reviewSettings, set }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [state, setState] = (0, react.useState)(() => reviewSettings.getSnapshot());
			(0, react.useEffect)(() => reviewSettings.subscribe(() => {
				setState(reviewSettings.getSnapshot());
			}), [reviewSettings]);
			const update = (0, react.useCallback)((patch) => {
				for (const [field, value] of Object.entries(patch)) set(field, value);
			}, [set]);
			const prefs = state.prefs;
			const disabled = state.status !== "ready" || !state.writable;
			return (0, react_jsx_runtime.jsxs)("li", {
				className: review_module_css_default.pluginCard + (open ? " " + review_module_css_default.pluginCardOpen : ""),
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: review_module_css_default.pluginCardHead,
					"aria-expanded": open,
					"aria-label": (open ? t("settings.collapse") : t("settings.expand")) + ": " + t("settings.title"),
					onClick: () => {
						setOpen((value) => !value);
					},
					children: [(0, react_jsx_runtime.jsxs)("span", {
						className: review_module_css_default.pluginCardHeadText,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.pluginCardName,
							children: t("settings.title")
						}), (0, react_jsx_runtime.jsx)("span", {
							className: review_module_css_default.pluginCardDescription,
							children: t("settings.description")
						})]
					}), (0, react_jsx_runtime.jsx)(ChevronIcon, { rotated: open })]
				}), open && (0, react_jsx_runtime.jsxs)("div", {
					className: review_module_css_default.pluginCardBody,
					children: [
						state.status !== "ready" && (0, react_jsx_runtime.jsx)("p", {
							className: review_module_css_default.pluginCardNote,
							children: t("settings.loading")
						}),
						state.status === "ready" && !state.writable && (0, react_jsx_runtime.jsx)("p", {
							className: review_module_css_default.pluginCardNote,
							children: t("settings.readOnly")
						}),
						(0, react_jsx_runtime.jsx)(PrefRow, {
							label: t("settings.layout"),
							hint: t("settings.layoutHint"),
							value: prefs.viewMode,
							disabled,
							options: [{
								key: "split",
								label: t("view.split")
							}, {
								key: "unified",
								label: t("view.unified")
							}],
							onChange: (key) => {
								update({ viewMode: key === "unified" ? "unified" : "split" });
							}
						}),
						(0, react_jsx_runtime.jsx)(PrefRow, {
							label: t("settings.scope"),
							hint: t("settings.scopeHint"),
							value: prefs.searchScope,
							disabled,
							options: [
								{
									key: "diff",
									label: t("search.scope.diff")
								},
								{
									key: "content",
									label: t("search.scope.content")
								},
								{
									key: "path",
									label: t("search.scope.path")
								}
							],
							onChange: (key) => {
								update({ searchScope: key === "content" ? "content" : key === "path" ? "path" : "diff" });
							}
						}),
						(0, react_jsx_runtime.jsx)(PrefRow, {
							label: t("settings.rail"),
							hint: t("settings.railHint"),
							value: prefs.graphCollapsed ? "collapsed" : "expanded",
							disabled,
							options: [{
								key: "expanded",
								label: t("settings.railExpanded")
							}, {
								key: "collapsed",
								label: t("settings.railCollapsed")
							}],
							onChange: (key) => {
								update({ graphCollapsed: key === "collapsed" });
							}
						}),
						(0, react_jsx_runtime.jsxs)("div", {
							className: review_module_css_default.pluginPrefRow,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: review_module_css_default.pluginPrefText,
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pluginPrefLabel,
									children: t("settings.matching")
								}), (0, react_jsx_runtime.jsx)("span", {
									className: review_module_css_default.pluginPrefHint,
									children: t("settings.matchingHint")
								})]
							}), (0, react_jsx_runtime.jsx)("span", {
								className: review_module_css_default.pluginPrefGroup,
								role: "group",
								"aria-label": t("settings.matching"),
								children: [["cs", t("settings.matchCS")], ["rx", t("settings.matchRx")]].map(([key, label]) => {
									const active = key === "cs" ? prefs.searchCS : prefs.searchRegex;
									return (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										disabled,
										"aria-pressed": active,
										className: review_module_css_default.pluginPrefBtn + (active ? " " + review_module_css_default.pluginPrefBtnActive : ""),
										onClick: () => {
											update(key === "cs" ? { searchCS: !prefs.searchCS } : { searchRegex: !prefs.searchRegex });
										},
										children: label
									}, key);
								})
							})]
						}),
						(0, react_jsx_runtime.jsx)(PrefRow, {
							label: t("settings.ws"),
							hint: t("settings.wsHint"),
							value: prefs.wsIgnore ? "ignore" : "show",
							disabled,
							options: [{
								key: "show",
								label: t("settings.wsShow")
							}, {
								key: "ignore",
								label: t("settings.wsIgnore")
							}],
							onChange: (key) => {
								update({ wsIgnore: key === "ignore" });
							}
						}),
						(0, react_jsx_runtime.jsx)(PrefRow, {
							label: t("settings.syntax"),
							hint: t("settings.syntaxHint"),
							value: prefs.syntaxHighlight ? "on" : "off",
							disabled,
							options: [{
								key: "on",
								label: t("settings.syntaxOn")
							}, {
								key: "off",
								label: t("settings.syntaxOff")
							}],
							onChange: (key) => {
								update({ syntaxHighlight: key === "on" });
							}
						}),
						state.status === "ready" && (0, react_jsx_runtime.jsx)("p", {
							className: review_module_css_default.pluginCardNote,
							children: t("settings.instantNote")
						})
					]
				})]
			});
		}
		//#endregion
		//#region src/client/prefs.ts
		const PREFS_KEY = "dsh-git-review.prefs";
		const DEFAULT_PREFS = {
			viewMode: "split",
			searchScope: "diff",
			graphCollapsed: false,
			searchCS: false,
			searchRegex: false,
			wsIgnore: false,
			syntaxHighlight: true
		};
		function normalizePrefs(raw) {
			const source = typeof raw === "string" ? parseJson$1(raw) : raw;
			if (source === null || typeof source !== "object") return { ...DEFAULT_PREFS };
			const record = source;
			return {
				viewMode: record.viewMode === "unified" ? "unified" : "split",
				searchScope: record.searchScope === "content" || record.searchScope === "path" ? record.searchScope : "diff",
				graphCollapsed: record.graphCollapsed === true,
				searchCS: record.searchCS === true,
				searchRegex: record.searchRegex === true,
				wsIgnore: record.wsIgnore === true,
				syntaxHighlight: record.syntaxHighlight !== false
			};
		}
		function parseJson$1(raw) {
			try {
				return JSON.parse(raw);
			} catch {
				return null;
			}
		}
		function loadPrefs(storage) {
			if (storage === void 0) return { ...DEFAULT_PREFS };
			try {
				return normalizePrefs(storage.getItem(PREFS_KEY));
			} catch {
				return { ...DEFAULT_PREFS };
			}
		}
		function savePrefs(storage, prefs) {
			if (storage === void 0) return;
			try {
				storage.setItem(PREFS_KEY, JSON.stringify(prefs));
			} catch {}
		}
		//#endregion
		//#region src/client/review-settings.ts
		function prefsFromSection(value) {
			return normalizePrefs(value);
		}
		function sectionIsDefault(value) {
			return prefsEqual(normalizePrefs(value), DEFAULT_PREFS);
		}
		function migrationFields(raw) {
			const prefs = typeof raw === "string" ? parseJson(raw) : raw;
			if (prefs === null || typeof prefs !== "object") return null;
			const normalized = normalizePrefs(prefs);
			return prefsEqual(normalized, DEFAULT_PREFS) ? null : normalized;
		}
		const PREF_FIELDS = Object.keys(DEFAULT_PREFS);
		function prefsEqual(a, b) {
			return PREF_FIELDS.every((field) => a[field] === b[field]);
		}
		function parseJson(raw) {
			try {
				return JSON.parse(raw);
			} catch {
				return null;
			}
		}
		function readLegacyRaw(storage) {
			if (storage === void 0) return null;
			try {
				return storage.getItem(PREFS_KEY);
			} catch {
				return null;
			}
		}
		function removeLegacyStore(storage) {
			if (storage === void 0) return;
			try {
				storage.removeItem(PREFS_KEY);
			} catch {}
		}
		function createReviewSettings(storage = typeof localStorage === "undefined" ? void 0 : localStorage) {
			let state = {
				status: "loading",
				prefs: loadPrefs(storage),
				writable: false
			};
			const listeners = new Set();
			let scope;
			let migrated = false;
			const publish = (next) => {
				if (next.status === state.status && next.writable === state.writable && prefsEqual(next.prefs, state.prefs)) return;
				state = next;
				for (const listener of listeners) listener();
			};
			return {
				store: {
					subscribe(listener) {
						listeners.add(listener);
						return () => {
							listeners.delete(listener);
						};
					},
					getSnapshot: () => state
				},
				attach(bound) {
					scope = bound;
					const sync = () => {
						const snap = bound.getSnapshot();
						if (snap.status !== "ready") {
							publish({
								status: snap.status === "unavailable" ? "unavailable" : "loading",
								prefs: state.prefs,
								writable: false
							});
							return;
						}
						if (!migrated) {
							migrated = true;
							const raw = readLegacyRaw(storage);
							if (raw !== null) {
								const fields = migrationFields(raw);
								if (fields !== null && snap.writable && sectionIsDefault(snap.value)) {
									const pending = Object.entries(fields).map(([field, value]) => bound.set(field, value));
									Promise.allSettled(pending).then((results) => {
										if (results.every((result) => result.status === "fulfilled")) removeLegacyStore(storage);
									});
								} else if (fields === null || sectionIsDefault(snap.value)) removeLegacyStore(storage);
							}
						}
						publish({
							status: "ready",
							prefs: prefsFromSection(snap.value),
							writable: snap.writable
						});
					};
					sync();
					return bound.subscribe(sync);
				},
				set(field, value) {
					const next = normalizePrefs({
						...state.prefs,
						[field]: value
					});
					if (state.status === "ready" && state.writable && scope !== void 0) {
						publish({
							status: state.status,
							prefs: next,
							writable: state.writable
						});
						scope.set(field, value).catch(() => {});
						return;
					}
					publish({
						status: state.status,
						prefs: next,
						writable: state.writable
					});
					savePrefs(storage, next);
				}
			};
		}
		//#endregion
		//#region src/client/locales.ts
		const NS = "git-review";
		const zh = {
			"tab": "审查",
			"branch": "分支",
			"refresh": "刷新",
			"refreshing": "刷新中…",
			"expandAll": "展开全部上下文",
			"collapseAll": "折叠未修改上下文",
			"scope.label": "变更范围",
			"scope.all": "全部",
			"scope.staged": "已暂存",
			"scope.unstaged": "未暂存",
			"view.label": "视图",
			"view.split": "双列",
			"view.unified": "单列",
			"view.file": "文件",
			"tree.mode.label": "文件范围",
			"tree.mode.changes": "变更",
			"tree.mode.all": "全部",
			"tree.listFailed": "文件列表读取失败",
			"file.loading": "读取文件中…",
			"file.empty": "空文件",
			"file.truncated": "文件过大，仅显示前一部分",
			"search.placeholder": "搜索变更内容…",
			"search.placeholderPath": "搜索文件名…",
			"search.placeholderContent": "搜索文件内容…",
			"search.files": "{count} 个文件命中",
			"search.scope": "搜索范围",
			"search.scope.diff": "差异内容",
			"search.scope.content": "文件内容",
			"search.scope.path": "文件名",
			"search.matching": "匹配方式",
			"search.caseSensitive": "区分大小写",
			"search.regex": "正则表达式",
			"search.flagCS": "Aa",
			"search.flagRegex": ".*",
			"search.prev": "上一处",
			"search.next": "下一处",
			"base.label": "对比基准",
			"base.worktree": "工作树",
			"compare.mode": "对比范围",
			"compare.worktree": "工作区",
			"compare.refs": "提交间",
			"compare.pickBase": "选择起点…",
			"compare.pickTarget": "选择终点…",
			"compare.pickHint": "选择分支、标签或提交作为比较基准",
			"compare.swap": "交换起点与终点",
			"compare.worktreeHint": "工作树与所选基准对比（基准可为任意分支/标签/提交）",
			"compare.refsHint": "任意两个分支、标签或提交之间三点对比",
			"settings.title": "Git 审查",
			"settings.description": "审查标签页的显示偏好：这里的修改即时生效，标签页内的切换也会被记住。",
			"settings.layout": "默认 diff 布局",
			"settings.layoutHint": "打开审查页时 diff 默认用双列并排还是单列",
			"settings.scope": "默认搜索范围",
			"settings.scopeHint": "打开审查页时，搜索框默认搜索的内容",
			"settings.rail": "图谱默认形态",
			"settings.railHint": "Git 图谱默认显示完整提交列表，还是折叠为窄条",
			"settings.railExpanded": "完整列表",
			"settings.railCollapsed": "折叠窄条",
			"settings.matching": "搜索匹配方式",
			"settings.matchingHint": "搜索默认是否区分大小写、是否按正则表达式匹配",
			"settings.matchCS": "区分大小写",
			"settings.matchRx": "正则表达式",
			"settings.instantNote": "偏好保存在 harness 设置文档中；标签页内的切换同样写回这里。",
			"settings.readOnly": "当前浏览器对偏好只读（记忆模式），控件已禁用。",
			"settings.loading": "正在读取偏好…",
			"settings.expand": "展开",
			"settings.collapse": "收起",
			"settings.ws": "空白改动",
			"settings.wsHint": "diff 是否隐藏仅空白字符的改动",
			"settings.wsShow": "显示空白",
			"settings.wsIgnore": "忽略空白",
			"settings.syntax": "语法高亮",
			"settings.syntaxHint": "diff 与文件视图是否按语法着色（超大差异自动降级）",
			"settings.syntaxOn": "开启",
			"settings.syntaxOff": "关闭",
			"ref.branches": "本地分支",
			"ref.remotes": "远程分支",
			"ref.tags": "标签",
			"ref.commits": "提交",
			"ref.current": "当前 HEAD",
			"picker.search": "搜索分支 / 标签 / 提交…",
			"picker.empty": "没有匹配项",
			"picker.truncated": "仅显示前 {count} 个提交，可输入搜索缩小范围",
			"picker.loadingCommits": "加载提交历史…",
			"viewTab.changes": "变更",
			"viewTab.graph": "图谱",
			"graph.loading": "读取提交历史…",
			"graph.failed": "提交历史读取失败",
			"graph.empty": "仓库还没有提交",
			"graph.truncated": "仅显示最近 {count} 个提交",
			"graph.loadMore": "加载更早的提交（已显示 {count} 个）…",
			"graph.search": "搜索提交（消息/作者/哈希）…",
			"graph.selectCommit": "选择提交查看内容",
			"graph.selectHint": "点击图谱中的任一提交",
			"graph.noMatches": "没有匹配的提交",
			"graph.headRef": "本地分支",
			"graph.tagRef": "标签",
			"graph.parent": "父提交",
			"graph.noFiles": "该提交没有文件变更（例如合并提交）",
			"graph.filesCount": "{count} 个文件更改",
			"graph.col.graph": "图",
			"graph.col.subject": "描述",
			"graph.col.date": "日期",
			"graph.col.author": "作者",
			"graph.col.commit": "提交",
			"graph.detailExpand": "展开提交详情",
			"graph.detailCollapse": "折叠提交详情",
			"graph.field.author": "作者",
			"graph.field.changes": "变更",
			"graph.copyHash": "点击复制完整哈希",
			"graph.copied": "已复制",
			"graph.worktree": "未提交的更改（{count} 个文件）",
			"graph.worktreeHint": "查看工作区未提交的变更",
			"graph.collapseList": "折叠提交列表（点击拓扑行仍可切换提交）",
			"graph.expandList": "展开提交列表",
			"commit.title": "提交或推送",
			"commit.message": "提交信息",
			"commit.stageAll": "包含全部变更（含未跟踪）",
			"commit.amend": "修订上一条提交（amend）",
			"commit.commitHint": "Ctrl+Enter 提交",
			"commit.commit": "提交",
			"commit.confirmCommit": "确认提交",
			"commit.commitPush": "提交并推送",
			"commit.confirmCommitPush": "确认提交并推送",
			"commit.push": "仅推送",
			"commit.confirmPush": "确认推送",
			"commit.running": "agent 运行中，提交/推送已禁用",
			"commit.busy": "执行中…",
			"branch.manage": "分支管理",
			"branch.newName": "新分支名",
			"branch.fromHead": "起点：当前 HEAD",
			"branch.create": "创建",
			"branch.switch": "切换到此分支",
			"branch.switching": "切换分支…",
			"branch.rename": "重命名",
			"branch.delete": "删除分支",
			"branch.confirmDelete": "确认删除",
			"branch.forceDelete": "强制删除（未合并）",
			"branch.current": "当前分支",
			"branch.busy": "执行中…",
			"branch.local": "本地分支",
			"branch.remote": "远程分支",
			"branch.track": "检出为本地分支",
			"branch.trackHint": "以该远程分支为起点创建本地跟踪分支并切换过去",
			"tag.title": "标签",
			"tag.newName": "新标签名，如 v1.0.0",
			"tag.create": "创建标签",
			"tag.fromTarget": "目标：当前 HEAD",
			"tag.delete": "删除标签",
			"tag.confirmDelete": "确认删除",
			"tag.push": "推送标签",
			"tag.empty": "没有标签",
			"guide.title": "快速上手",
			"guide.step1": "左上选对比范围：工作区改动或任意两提交三点对比",
			"guide.step2": "搜索框可切文件名 / 差异内容 / 文件内容，j/k 漫游文件",
			"guide.step3": "图谱看提交泳道，右键提交可重置 / 还原 / 择取",
			"guide.dismiss": "知道了，不再显示",
			"guide.reopen": "显示新手引导",
			"menu.openDefault": "打开",
			"menu.reveal": "在文件管理器中显示",
			"menu.openWith": "打开方式…",
			"menu.app.default": "默认应用",
			"menu.app.explorer": "文件资源管理器",
			"menu.app.notepad": "记事本",
			"menu.app.code": "VS Code",
			"menu.app.codeInsiders": "VS Code Insiders",
			"menu.appUnavailable": "未安装",
			"menu.copyPath": "复制路径",
			"menu.copyName": "复制文件名",
			"menu.addToChat": "添加到对话",
			"menu.rename": "重命名…",
			"menu.confirmRename": "确认重命名",
			"menu.delete": "删除…",
			"menu.confirmDelete": "确认删除",
			"menu.confirmDeleteTitle": "确认删除文件",
			"menu.stage": "暂存",
			"menu.unstage": "取消暂存",
			"menu.discard": "放弃更改…",
			"menu.confirmDiscardTitle": "放弃此文件的未提交更改",
			"menu.confirmDiscard": "确认放弃（不可恢复）",
			"branch.fetch": "拉取远程",
			"branch.fetchDone": "拉取完成",
			"stash.title": "贮藏（stash）",
			"stash.push": "贮藏更改",
			"stash.includeUntracked": "含未跟踪",
			"stash.apply": "应用",
			"stash.pop": "应用并移除",
			"stash.drop": "删除",
			"stash.confirmDrop": "确认删除",
			"stash.empty": "没有贮藏",
			"menu.cancel": "取消",
			"menu.back": "返回",
			"menu.busy": "执行中…",
			"menu.chatUnavailable": "对话输入通道不可用",
			"menu.unavailable": "该操作当前不可用",
			"menu.clipboardFailed": "剪贴板不可用",
			"comment.add": "添加评论",
			"comment.placeholder": "评论此行，将写入对话输入框",
			"comment.write": "写入输入框",
			"comment.cancel": "取消",
			"comment.saveDraft": "存入草稿箱",
			"comment.draftsTitle": "评论草稿箱",
			"comment.sendAll": "全部写入对话",
			"comment.clearDrafts": "清空",
			"comment.removeDraft": "移除该条",
			"comment.emptyDrafts": "暂无待发评论。在 diff 行悬停 💬 即可添加。",
			"filesChanged": "{count} 个文件更改",
			"filter": "筛选文件…",
			"tree.empty": "没有匹配的文件",
			"tree.noChanges": "工作区没有未提交的更改",
			"badge.added": "新增",
			"badge.modified": "修改",
			"badge.deleted": "删除",
			"badge.renamed": "重命名",
			"badge.copied": "复制",
			"badge.untracked": "未跟踪",
			"badge.staged": "已暂存",
			"badge.conflict": "冲突",
			"empty.title": "选择文件查看差异",
			"empty.hint": "在文件树中选择一个已更改的文件",
			"state.loading": "读取变更中…",
			"state.notRepo.title": "当前工作区不是 git 仓库",
			"state.notRepo.hint": "审查页展示工作区相对 HEAD 的全部变更；此目录未初始化 git。",
			"state.noWorkspace": "没有可用的工作区",
			"state.hostUnavailable": "host 服务不可用（插件 host 半未启用）",
			"state.error": "读取失败",
			"diff.loading": "读取差异中…",
			"diff.binary": "二进制文件，无法显示文本差异",
			"diff.binarySize": "二进制文件（{size} 字节）",
			"diff.truncated": "差异过大，已截断显示",
			"diff.renderCapped": "差异行数过多，仅渲染前 {count} 行",
			"diff.noTextChanges": "没有文本差异（可能仅有模式/权限变更）",
			"diff.newFile": "新文件",
			"diff.deletedFile": "已删除",
			"diff.binaryFile": "二进制",
			"diff.renamedFrom": "自 {path} 重命名",
			"diff.unmodifiedLines": "{count} 行未修改",
			"diff.expandHint": "点击展开全部上下文",
			"diff.noNewline": "无换行符",
			"diff.ws": "忽略空白",
			"diff.wsHint": "隐藏仅空白字符的改动（缩进、行尾空格）",
			"hunk.stage": "暂存此段",
			"hunk.stageHint": "把该段改动登入暂存区（git apply --cached）",
			"hunk.unstage": "取消暂存此段",
			"hunk.unstageHint": "把该段改动退回未暂存（git apply --cached --reverse）",
			"hunk.revert": "还原此段",
			"hunk.revertConfirm": "确认还原？",
			"hunk.revertHint": "丢弃该段全部未提交改动，不可恢复",
			"preview.toggle": "预览",
			"preview.source": "源码",
			"preview.loading": "正在加载预览…",
			"preview.loadFailed": "预览加载失败",
			"preview.tooLarge": "文件过大无法预览，请用外部应用打开",
			"preview.openHint": "可右键用外部应用打开",
			"preview.copy": "复制",
			"preview.copied": "已复制",
			"preview.footnotes": "脚注",
			"preview.zoomIn": "放大",
			"preview.zoomOut": "缩小",
			"preview.zoomFit": "适应",
			"preview.zoomHint": "Ctrl+滚轮缩放，双击在适应窗口与 100% 间切换，可直接输入百分比",
			"blame.toggle": "追溯",
			"blame.hint": "逐行显示最后修改者（git blame）",
			"blame.loading": "正在读取追溯…",
			"history.toggle": "历史",
			"history.hint": "查看该文件的提交历史",
			"history.title": "文件历史",
			"history.empty": "没有找到提交",
			"history.truncated": "仅显示最近 500 条，更早的提交请在图谱中加载",
			"history.jumpHint": "在图谱中查看该提交",
			"history.unknownHint": "该提交不在当前图谱窗口，切换到图谱后可加载更多",
			"tree.resizeHint": "拖拽调整树面板宽度，双击恢复默认",
			"viewed.mark": "标记为已审",
			"viewed.marked": "已审（文件再次变更时会自动取消）",
			"tree.pending": "{count} 个文件待审",
			"aheadBehind.title": "领先上游 {ahead} 个提交、落后 {behind} 个",
			"conflict.inProgress": "{kind}进行中 · {count} 个冲突文件待解决",
			"conflict.kind.merge": "合并",
			"conflict.kind.rebase": "变基",
			"conflict.kind.cherry-pick": "择取",
			"conflict.kind.revert": "还原",
			"conflict.continue": "继续{kind}",
			"conflict.abort": "中止{kind}",
			"conflict.abortConfirm": "确认中止",
			"conflict.ours": "采用当前分支（ours）",
			"conflict.theirs": "采用对方（theirs）",
			"conflict.done": "冲突已解决",
			"history.reset": "重置到此提交…",
			"history.resetTitle": "把当前分支重置到此提交",
			"history.resetSoft": "软重置（soft）",
			"history.resetSoftHint": "保留暂存与工作区",
			"history.resetMixed": "混合重置（mixed）",
			"history.resetMixedHint": "保留工作区，取消暂存",
			"history.resetHard": "强制重置（hard）",
			"history.resetHardHint": "丢弃全部改动；此后新增的文件保留为未跟踪",
			"history.revert": "还原此提交（生成反向提交）",
			"history.cherryPick": "择取到当前分支",
			"branch.merge": "合并到当前分支",
			"branch.pull": "拉取并合并"
		};
		const en = {
			"tab": "Review",
			"branch": "Branch",
			"refresh": "Refresh",
			"refreshing": "Refreshing…",
			"expandAll": "Expand all context",
			"collapseAll": "Collapse unmodified context",
			"scope.label": "Change scope",
			"scope.all": "All",
			"scope.staged": "Staged",
			"scope.unstaged": "Unstaged",
			"view.label": "View",
			"view.split": "Side-by-side",
			"view.unified": "Unified",
			"view.file": "File",
			"tree.mode.label": "File scope",
			"tree.mode.changes": "Changes",
			"tree.mode.all": "All",
			"tree.listFailed": "Failed to list files",
			"file.loading": "Loading file…",
			"file.empty": "Empty file",
			"file.truncated": "File too large; showing the first part",
			"search.placeholder": "Search changes…",
			"search.placeholderPath": "Search file names…",
			"search.placeholderContent": "Search file contents…",
			"search.files": "{count} files match",
			"search.scope": "Search scope",
			"search.scope.diff": "Diff content",
			"search.scope.content": "File contents",
			"search.scope.path": "File names",
			"search.matching": "Matching",
			"search.caseSensitive": "Case sensitive",
			"search.regex": "Regular expression",
			"search.flagCS": "Aa",
			"search.flagRegex": ".*",
			"search.prev": "Previous match",
			"search.next": "Next match",
			"base.label": "Diff base",
			"base.worktree": "working tree",
			"compare.mode": "Compare range",
			"compare.worktree": "Working tree",
			"compare.refs": "Commits",
			"compare.pickBase": "Pick base…",
			"compare.pickTarget": "Pick target…",
			"compare.pickHint": "Pick a branch, tag or commit as the comparison base",
			"compare.swap": "Swap base and target",
			"compare.worktreeHint": "Compare the working tree against a base of any branch/tag/commit",
			"compare.refsHint": "Three-dot compare between any two branches, tags or commits",
			"settings.title": "Git Review",
			"settings.description": "Display preferences for the Review tab: changes apply instantly, and flips inside the tab are remembered too.",
			"settings.layout": "Default diff layout",
			"settings.layoutHint": "Whether the diff starts side-by-side or single-column when the tab opens",
			"settings.scope": "Default search scope",
			"settings.scopeHint": "What the search targets by default when the tab opens",
			"settings.rail": "Default graph form",
			"settings.railHint": "Whether the Git graph starts as the full commit list or the folded rail",
			"settings.railExpanded": "Full list",
			"settings.railCollapsed": "Folded rail",
			"settings.matching": "Search matching",
			"settings.matchingHint": "Whether searches are case-sensitive and regex-based by default",
			"settings.matchCS": "Case sensitive",
			"settings.matchRx": "Regex",
			"settings.instantNote": "Preferences live in the harness settings document; flips inside the tab write back to the same section.",
			"settings.readOnly": "This browser is read-only for preferences (memory mode); controls are disabled.",
			"settings.loading": "Reading preferences…",
			"settings.expand": "Expand",
			"settings.collapse": "Collapse",
			"settings.ws": "Whitespace edits",
			"settings.wsHint": "Whether the diff hides whitespace-only edits",
			"settings.wsShow": "Show whitespace",
			"settings.wsIgnore": "Ignore whitespace",
			"settings.syntax": "Syntax highlighting",
			"settings.syntaxHint": "Whether diff and file lines get lightweight syntax coloring (very large diffs degrade automatically)",
			"settings.syntaxOn": "On",
			"settings.syntaxOff": "Off",
			"ref.branches": "Local branches",
			"ref.remotes": "Remote branches",
			"ref.tags": "Tags",
			"ref.commits": "Commits",
			"ref.current": "Current HEAD",
			"picker.search": "Search branches / tags / commits…",
			"picker.empty": "No matches",
			"picker.truncated": "Showing first {count} commits — type to narrow",
			"picker.loadingCommits": "Loading commits…",
			"viewTab.changes": "Changes",
			"viewTab.graph": "Graph",
			"graph.loading": "Loading history…",
			"graph.failed": "Failed to load history",
			"graph.empty": "No commits yet",
			"graph.truncated": "Showing the latest {count} commits",
			"graph.loadMore": "Load earlier commits ({count} shown)…",
			"graph.search": "Search commits (message/author/hash)…",
			"graph.selectCommit": "Select a commit to see its changes",
			"graph.selectHint": "Pick a commit in the graph",
			"graph.noMatches": "No matching commits",
			"graph.headRef": "Local branch",
			"graph.tagRef": "Tag",
			"graph.parent": "Parent",
			"graph.noFiles": "No file changes in this commit (e.g. a merge)",
			"graph.filesCount": "{count} files changed",
			"graph.col.graph": "Graph",
			"graph.col.subject": "Description",
			"graph.col.date": "Date",
			"graph.col.author": "Author",
			"graph.col.commit": "Commit",
			"graph.detailExpand": "Show commit details",
			"graph.detailCollapse": "Hide commit details",
			"graph.field.author": "Author",
			"graph.field.changes": "Changes",
			"graph.copyHash": "Click to copy the full hash",
			"graph.copied": "Copied",
			"graph.worktree": "Uncommitted changes ({count} files)",
			"graph.worktreeHint": "See the uncommitted workspace changes",
			"graph.collapseList": "Collapse the commit list (topology rows stay clickable)",
			"graph.expandList": "Expand the commit list",
			"commit.title": "Commit or push",
			"commit.message": "Commit message",
			"commit.stageAll": "Stage all changes (incl. untracked)",
			"commit.amend": "Amend the last commit",
			"commit.commitHint": "Ctrl+Enter to commit",
			"commit.commit": "Commit",
			"commit.confirmCommit": "Confirm commit",
			"commit.commitPush": "Commit & push",
			"commit.confirmCommitPush": "Confirm commit & push",
			"commit.push": "Push",
			"commit.confirmPush": "Confirm push",
			"commit.running": "Agent is running; commit/push disabled",
			"commit.busy": "Working…",
			"branch.manage": "Manage branches",
			"branch.newName": "New branch name",
			"branch.fromHead": "Start: current HEAD",
			"branch.create": "Create",
			"branch.switch": "Switch to this branch",
			"branch.switching": "Switching…",
			"branch.rename": "Rename",
			"branch.delete": "Delete branch",
			"branch.confirmDelete": "Confirm delete",
			"branch.forceDelete": "Force delete (unmerged)",
			"branch.current": "Current branch",
			"branch.busy": "Working…",
			"branch.local": "Local branches",
			"branch.remote": "Remote branches",
			"branch.track": "Check out as local branch",
			"branch.trackHint": "Create a local tracking branch from this remote and switch to it",
			"tag.title": "Tags",
			"tag.newName": "New tag name, e.g. v1.0.0",
			"tag.create": "Create tag",
			"tag.fromTarget": "Target: current HEAD",
			"tag.delete": "Delete tag",
			"tag.confirmDelete": "Confirm delete",
			"tag.push": "Push tag",
			"tag.empty": "No tags",
			"guide.title": "Quick start",
			"guide.step1": "Pick the range top-left: worktree changes or any two refs (three-dot)",
			"guide.step2": "Search file names / diff text / file content; walk files with j/k",
			"guide.step3": "Read the lane graph; right-click a commit to reset / revert / cherry-pick",
			"guide.dismiss": "Got it, hide this",
			"guide.reopen": "Show the quick-start guide",
			"menu.openDefault": "Open",
			"menu.reveal": "Reveal in file manager",
			"menu.openWith": "Open with…",
			"menu.app.default": "Default app",
			"menu.app.explorer": "File Explorer",
			"menu.app.notepad": "Notepad",
			"menu.app.code": "VS Code",
			"menu.app.codeInsiders": "VS Code Insiders",
			"menu.appUnavailable": "not installed",
			"menu.copyPath": "Copy path",
			"menu.copyName": "Copy file name",
			"menu.addToChat": "Add to conversation",
			"menu.rename": "Rename…",
			"menu.confirmRename": "Rename",
			"menu.delete": "Delete…",
			"menu.confirmDelete": "Delete",
			"menu.confirmDeleteTitle": "Delete file",
			"menu.stage": "Stage",
			"menu.unstage": "Unstage",
			"menu.discard": "Discard changes…",
			"menu.confirmDiscardTitle": "Discard this file’s uncommitted changes",
			"menu.confirmDiscard": "Discard (irreversible)",
			"branch.fetch": "Fetch remotes",
			"branch.fetchDone": "Fetch complete",
			"stash.title": "Stash",
			"stash.push": "Stash changes",
			"stash.includeUntracked": "Incl. untracked",
			"stash.apply": "Apply",
			"stash.pop": "Apply & remove",
			"stash.drop": "Drop",
			"stash.confirmDrop": "Confirm drop",
			"stash.empty": "No stashes",
			"menu.cancel": "Cancel",
			"menu.back": "Back",
			"menu.busy": "Working…",
			"menu.chatUnavailable": "Conversation input unavailable",
			"menu.unavailable": "This action is currently unavailable",
			"menu.clipboardFailed": "Clipboard unavailable",
			"comment.add": "Add comment",
			"comment.placeholder": "Comment on this line; written to the composer",
			"comment.write": "Write to composer",
			"comment.cancel": "Cancel",
			"comment.saveDraft": "Save to draft box",
			"comment.draftsTitle": "Comment drafts",
			"comment.sendAll": "Write all to composer",
			"comment.clearDrafts": "Clear",
			"comment.removeDraft": "Remove this entry",
			"comment.emptyDrafts": "No pending comments. Hover a diff line and use the 💬 button.",
			"filesChanged": "{count} files changed",
			"filter": "Filter files…",
			"tree.empty": "No matching files",
			"tree.noChanges": "No uncommitted changes in the workspace",
			"badge.added": "Added",
			"badge.modified": "Modified",
			"badge.deleted": "Deleted",
			"badge.renamed": "Renamed",
			"badge.copied": "Copied",
			"badge.untracked": "Untracked",
			"badge.staged": "Staged",
			"badge.conflict": "Conflict",
			"empty.title": "Select a file to see its diff",
			"empty.hint": "Pick a changed file in the file tree",
			"state.loading": "Loading changes…",
			"state.notRepo.title": "This workspace is not a git repository",
			"state.notRepo.hint": "The review tab shows workspace changes against HEAD; this directory has no git repository.",
			"state.noWorkspace": "No workspace available",
			"state.hostUnavailable": "Host API unavailable (plugin host half not enabled)",
			"state.error": "Failed to load",
			"diff.loading": "Loading diff…",
			"diff.binary": "Binary file; no textual diff",
			"diff.binarySize": "Binary file ({size} bytes)",
			"diff.truncated": "Diff too large; truncated",
			"diff.renderCapped": "Too many diff rows; showing the first {count}",
			"diff.noTextChanges": "No textual changes (mode/permission only)",
			"diff.newFile": "New file",
			"diff.deletedFile": "Deleted",
			"diff.binaryFile": "Binary",
			"diff.renamedFrom": "Renamed from {path}",
			"diff.unmodifiedLines": "{count} unmodified lines",
			"diff.expandHint": "Click to expand all context",
			"diff.noNewline": "no newline",
			"diff.ws": "Ignore whitespace",
			"diff.wsHint": "Hide whitespace-only edits (indentation, trailing blanks)",
			"hunk.stage": "Stage hunk",
			"hunk.stageHint": "Stage the changes of this hunk (git apply --cached)",
			"hunk.unstage": "Unstage hunk",
			"hunk.unstageHint": "Move this staged hunk back to unstaged (git apply --cached --reverse)",
			"hunk.revert": "Revert hunk",
			"hunk.revertConfirm": "Confirm revert?",
			"hunk.revertHint": "Discard all uncommitted changes in this hunk — irreversible",
			"preview.toggle": "Preview",
			"preview.source": "Source",
			"preview.loading": "Loading preview…",
			"preview.loadFailed": "Preview failed to load",
			"preview.tooLarge": "File too large to preview — open it externally",
			"preview.openHint": "right-click to open externally",
			"preview.copy": "Copy",
			"preview.copied": "Copied",
			"preview.footnotes": "Footnotes",
			"preview.zoomIn": "Zoom in",
			"preview.zoomOut": "Zoom out",
			"preview.zoomFit": "Fit",
			"preview.zoomHint": "Ctrl+wheel to zoom, double-click toggles fit/100%, or type a percentage",
			"blame.toggle": "Blame",
			"blame.hint": "Per-line last-touched info (git blame)",
			"blame.loading": "Reading blame…",
			"history.toggle": "History",
			"history.hint": "Commits that touched this file",
			"history.title": "File history",
			"history.empty": "No commits found",
			"history.truncated": "Showing the latest 500 — load more in the graph for older ones",
			"history.jumpHint": "View this commit in the graph",
			"history.unknownHint": "Not in the current graph window — open the graph and load more",
			"tree.resizeHint": "Drag to resize the tree; double-click to reset",
			"viewed.mark": "Mark reviewed",
			"viewed.marked": "Reviewed (auto-cleared when the file changes again)",
			"tree.pending": "{count} files pending review",
			"aheadBehind.title": "{ahead} ahead of / {behind} behind the upstream",
			"conflict.inProgress": "{kind} in progress · {count} conflicted files",
			"conflict.kind.merge": "Merge",
			"conflict.kind.rebase": "Rebase",
			"conflict.kind.cherry-pick": "Cherry-pick",
			"conflict.kind.revert": "Revert",
			"conflict.continue": "Continue {kind}",
			"conflict.abort": "Abort {kind}",
			"conflict.abortConfirm": "Confirm abort",
			"conflict.ours": "Take current branch (ours)",
			"conflict.theirs": "Take incoming (theirs)",
			"conflict.done": "Conflicts resolved",
			"history.reset": "Reset to this commit…",
			"history.resetTitle": "Reset the current branch onto this commit",
			"history.resetSoft": "Soft reset",
			"history.resetSoftHint": "keeps index and worktree",
			"history.resetMixed": "Mixed reset",
			"history.resetMixedHint": "keeps the worktree, unstages",
			"history.resetHard": "Hard reset",
			"history.resetHardHint": "discards all changes; files new to this commit stay untracked",
			"history.revert": "Revert (new inverse commit)",
			"history.cherryPick": "Cherry-pick onto this branch",
			"branch.merge": "Merge into current branch",
			"branch.pull": "Pull & merge"
		};
		//#endregion
		//#region src/client/glass.ts
		const GLASS_GLOBAL = "__DSH_BACKGROUND_GLASS__";
		const GLASS_EVENT = "dsh-background-glass:ready";
		function isGlassBridge(value) {
			if (value === null || typeof value !== "object") return false;
			const candidate = value;
			return candidate.version === 1 && candidate.bridgeId === "deepseek-harness-background" && typeof candidate.isActive === "function" && typeof candidate.register === "function";
		}
		function subscribeGlassReady(listener) {
			const existing = window[GLASS_GLOBAL];
			if (isGlassBridge(existing)) listener(existing);
			const onReady = (event) => {
				const detail = event.detail;
				if (!isGlassBridge(detail)) return;
				listener(detail);
			};
			window.addEventListener(GLASS_EVENT, onReady);
			return () => {
				window.removeEventListener(GLASS_EVENT, onReady);
			};
		}
		//#endregion
		//#region src/client/index.ts
		const inject = [
			"slots",
			"sessions",
			"locale"
		];
		const SETTINGS_NAMESPACE = "dsh-git-review";
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-git-review: dictionaries");
			ctx.effect(() => {
				let unregister;
				let disposed = false;
				const unsubscribe = subscribeGlassReady((glass) => {
					if (disposed) return;
					unregister?.();
					try {
						unregister = glass.register({
							plugin: "dsh-git-review",
							selectors: [
								"[data-git-review-toolbar]",
								"[data-git-review-tree]",
								"[data-git-review-diff]"
							],
							mode: "fill"
						});
					} catch {
						unregister = void 0;
					}
				});
				return () => {
					disposed = true;
					unsubscribe();
					unregister?.();
				};
			}, "dsh-git-review: frosted-glass surfaces");
			const t = ctx.locale.bind(NS);
			const settings = createReviewSettings();
			ctx.slots.inject("conversation.view", () => ctx.slots.register({
				name: "conversation.view",
				id: "git-review",
				order: 20,
				locale: NS,
				label: () => t("tab"),
				inject: (sessionId) => ({
					cwd: ctx.sessions.list.getSnapshot().byId[sessionId]?.cwd,
					settings
				})
			}, ReviewView));
			ctx.inject(["settingsScope"], (raw) => {
				const binder = raw.settingsScope;
				if (binder === void 0) return;
				ctx.effect(() => settings.attach(binder.bind({ namespace: SETTINGS_NAMESPACE })), "dsh-git-review: settings scope");
				ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
					name: "settings.plugin.item",
					key: SETTINGS_NAMESPACE,
					locale: NS,
					inject: () => ({
						reviewSettings: settings.store,
						set: (field, value) => {
							settings.set(field, value);
						}
					})
				}, (props) => (0, react.createElement)(SettingsCard, props)));
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
