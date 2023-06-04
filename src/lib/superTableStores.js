import { get, writable } from "svelte/store";

// The state store holds UI/UX related synch changes to avoind unecessary refreshes of the main data store
// It acts as the single source of truth for all super columns to adjust accordingly
export const createSuperTableStateStore = () => {
	const { set, update, subscribe } = writable({
		controllerID: null,
		columnRowHeights: [],
		rowHeights: [],
		hoveredRow: null,
		hoveredColumn: null,
		loaded: false,
		rowClicked: null,
		scrollY: 0,
		screenX: 0,
		size: "M"
	})

	return {
		set,
		update,
		subscribe,
		updateRowHeights(columnID, newRowHeights) {
			update(state => {
				let index = state.columnRowHeights.findIndex(v => v.columnID === columnID)

				if (index > -1) {
					state.columnRowHeights[index].rowHeights = newRowHeights
				} else {
					state.columnRowHeights.push({ columnID: columnID, rowHeights: newRowHeights })
				}
				
				if ( newRowHeights.length < state.rowHeights.length ) state.rowHeights.length = newRowHeights.length 

				newRowHeights.forEach( ( v, idx )  => {
					state.rowHeights[idx] = Math.max (...state.columnRowHeights.map(t => t.rowHeights[idx]))
				})
				
				return state
			})
		}
	}
}

export const createSuperTableThemeStore = () => {
	const { set, update, subscribe } = writable({
		headerAlign: "flex-start",
		headerFontColor: "var(--spectrum-table-m-regular-header-text-color, var(--spectrum-alias-label-text-color))",
		headerFontSize: undefined,
		headerFontWeight: undefined,
		headerBackground: undefined,
		headerHorizontalPadding: undefined,
		headerVerticalPadding: undefined,
		rowVerticalAlign: "flex-start",
		rowVerticalPadding: 11,
		rowHorizontalAlign: "flex-start",
		rowHorizontalPadding: 16,
		rowFontColor: undefined,
		rowFontSize: 14,
		rowBackground: undefined,
		footerAlign: "flex-start",
		footerFontColor: undefined,
		footerFontSize: undefined,
		footerBackground: undefined,
		dividers: "horizontal",
		dividersColor: undefined,
		maxBodyHeight: undefined,
		showFooter: false
	})

	return { set, update, subscribe }
}

// The FilterStore will hold all filter definitions as requested by each Super Column
// so the can be centrally applied to the dataProvider by the Super Table
export const createSuperTableFilterStore = () => {
	const { set, update, subscribe } = writable({
	  filters: [],
	  showFilters: false,
	});
  
	return {
	  subscribe,
	  setFilter(filter) {
		update((state) => {
		  const index = state.filters.findIndex((v) => v.id === filter.id);
		  const lowercaseValue = filter.value.toLowerCase();
	  
		  if (index > -1) {
			state.filters[index] = filter;
		  } else {
			state.filters.push(filter);
		  }
	  
		  // Update the filtered data with the new filter
		  state.filteredData = state.data.filter((item) => {
			// Convert the item value to lowercase for case-insensitive matching
			const lowercaseItemValue = item.value.toLowerCase();
			return lowercaseItemValue.includes("lief");
		  });
	  
		  return state;
		});
	  },	  
	  
	  clearFilter(filter) {
		update((state) => {
		  const index = state.filters.findIndex((v) => v.id === filter.id);
		  state.filters.splice(index, index >= 0 ? 1 : 0);
		  return state;
		});
	  },
	};
  };
  



// The main store holds the data related and Super Table Columns registration and data synchronization
export const createSuperTableDataStore = () => {
	const { set, update, subscribe } = writable({
		_parentID: undefined,
		dataSource: {},
		schema: {},
		data: [],
		loaded: false,
		dataChanges: [],
		idColumn: null,
		registeredColumns: [],
		selectedRows: [],
		filters: [],
		isFiltered: false,
		sortColumn: undefined,
		sortDirection: undefined
	});

	return {
		set,
		update,
		subscribe,
		nextUnusedField() {
			let state = get(this)
			let allFields = Object.keys(state.schema ?? {})
			let usedFields = state.registeredColumns.map(v => v.field)
			let freeField = allFields.filter(v => !usedFields.includes(v))
			return freeField[0] ?? ""
		},

		lastUsedField() {
			let state = get(this)
			let usedFields = state.registeredColumns.map(v => v.field)
			return usedFields[usedFields.length - 1]
		},

		registerColumn(column) {
			update(state => ({ ...state, registeredColumns: [...state.registeredColumns, column] }))
		},

		unregisterColumn(column) {
			update(state => {
				let index = state.registeredColumns.findIndex(v => v.id === column.id);
				state.registeredColumns.splice(index, index >= 0 ? 1 : 0);
				return state;
			});
		},

		updateColumn(column) {
			if (column.id && column.field) {
				update(state => {
					let index = state.registeredColumns.findIndex(v => v.id === column.id)
					if (index > -1) state.registeredColumns[index] = column
					return state
				});
			}
		},
		logDataChange(rowKey, field, originalValue, newValue) {
			let newChange = {
				rowKey: rowKey,
				field: field,
				originalValue: originalValue,
				newValue: newValue
			}
			update(state => ({ ...state, dataChanges: [...state.dataChanges, newChange] }))
		}
	};
};