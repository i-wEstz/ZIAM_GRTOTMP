sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, MessageBox, Utilities, History, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.dbiB1Wm012GrToTempCopy.controller.GrByTag", {
		handleRouteMatched: function(oEvent) {

			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;
				var oPath;
				if (this.sContext) {
					oPath = {
						path: "/" + this.sContext,
						parameters: oParams
					};
					this.getView().bindObject(oPath);
				}
			}

		},
		selectedID: "",
		selectedGr: "",
		previousModel: "",
		tagInput: function(oEvent) {
			// var tagId = this.getView().byId('tagid').getValue();
			// var url = this.getView().getModel().sServiceUrl + "/TagInfoHeaderSet('" + tagId + "')";
			var url = this.getView().getModel().sServiceUrl;
			var oModel = new sap.ui.model.odata.v2.ODataModel(url, true);
			var oTable = this.getView().byId("tagTable");
			var oSelect = this.getView().byId("batchCombo");
			this.oHeaderModel = new sap.ui.model.json.JSONModel();
			this.oItemsModel = new sap.ui.model.json.JSONModel();
			// var tableModel = new sap.ui.model.odata.ODataModel();
			// var that = this;
			var value = oEvent.getSource().getValue();
			var sGroup = jQuery.sap.uid();
			var sGroup2 = jQuery.sap.uid() + "2";
			oModel.setDeferredGroups([sGroup]);
			//Read Header
			oModel.read("/TagInfoHeaderSet('" + value + "')", {
				groupId: sGroup
			});
			//Read Items
			oModel.read("/TagInfoHeaderSet('" + value + "')/Items", {
				groupId: sGroup
			});
			oModel.submitChanges({
				groupId: sGroup,
				success: function(oResponse) {
					var statusCode;
					if (oResponse.__batchResponses[0].response === undefined) {
						statusCode = oResponse.__batchResponses[0].statusCode;
					} else {
						statusCode = oResponse.__batchResponses[0].response.statusCode;
					}

					//Read Batch
					if (statusCode !== "404") {
						this.oDataHeader = oResponse.__batchResponses[0].data;
						this.oHeaderModel.setData(this.oDataHeader);
						this.oDataItems = oResponse.__batchResponses[1].data.results;
						for (var i = 0; i < this.oDataItems.length; i++) {
							this.oDataItems[i].CfmQuantity = this.oDataItems[i].OrderQuantity;
						}
						this.oItemsModel.setData(this.oDataItems);
						if (this.oItemsModel.getData()[0].OrderType == "PP") {
							oModel.setDeferredGroups([sGroup2]);
							for (var i = 0; i < this.oDataItems.length; i++) {
								var filters = [];
								filters.push(new Filter("OrderNumber", FilterOperator.EQ, "'" + this.oDataItems[i].OrderNumber + "'"));
								filters.push(new Filter("MaterialNo", FilterOperator.EQ, "'" + this.oDataItems[i].MaterialNo + "'"));
								oModel.read("/BatchSet", {
									groupId: sGroup2,
									filters: filters
								});
							}
							oModel.submitChanges({
								groupId: sGroup2,
								success: function(oBatchResponse) {
									for (var j = 0; j < this.oDataItems.length; j++) {
										var size = oBatchResponse.__batchResponses[j].data.results.length - 1;
										this.oItemsModel.getData()[j].batchlist = oBatchResponse.__batchResponses[j].data.results;
										this.oItemsModel.getData()[j].selectedBatch = [{
											number: oBatchResponse.__batchResponses[j].data.results[size].BatchNo,
											gr: 0
										}];
										this.oItemsModel.getData()[j].selectedKey = oBatchResponse.__batchResponses[j].data.results[size].BatchNo;
									}
									this.getView().setModel(this.oHeaderModel, "header");
									this.getView().byId("tagTable").setModel(this.oItemsModel, "items");
								}.bind(this)
							});
						} else {
							this.getView().setModel(this.oHeaderModel, "header");
							oTable.setModel(this.oItemsModel, "items");
						}
					} //Not Found
					else {
						var headerModel = this.getView().getModel("header");
						var itemModel = oTable.getModel("items");
						if (headerModel && itemModel) {
							headerModel.setData(null);
							headerModel.updateBindings(true);
							itemModel.setData(null);
							itemModel.updateBindings(true);
						}

						sap.m.MessageToast.show("ID of Tag not found");
					}
				}.bind(this)

			});
		},
		checkListMode: function(OrderType) {
			if (OrderType == "PP") {
				return "Navigation";
			} else {
				return "Inactive";
			}
		},
		tagChange: function(oEvent) {
			var tags = this.getView().getModel("tags").getProperty("/tags");
			var oModel = new sap.ui.model.json.JSONModel();
			var headModel = new sap.ui.model.json.JSONModel();
			var oTable = this.getView().byId("tagTable");
			var oToolbar = this.getView().byId("title-toolbar");
			var isFound = false;
			oModel.setData(tags);

			for (var i = 0; i < oModel.getData().length; i++) {
				if (oModel.getData()[i].id == oEvent.mParameters.value) {
					var orderType = oModel.getData()[i].items[0].type;
					var orderNo = oModel.getData()[i].items[0].order;
					headModel.setData(oModel.getData()[i]);
					this.getView().setModel(headModel, "header");
					var Model = new sap.ui.model.json.JSONModel();
					Model.setData(oModel.getData()[i].items[0].material);

					var oCol = this.getView().byId("col-batch");
					if (orderType == "PP") {
						oCol.setVisible(true);
						this.getView().byId("col-list").setType("Navigation");
						var batch = this.getView().getModel("batch").getProperty("/batch");
						var bModel = new sap.ui.model.json.JSONModel();
						var oCombo = this.getView().byId("batchCombo");
						bModel.setData(batch);
						var index = bModel.getData().map(function(o) {
							return o.order;
						}).indexOf(orderNo);
						var bMaterial = bModel.getData()[index].material;
						for (var j = 0; j < Model.getData().length; j++) {
							var indexOfMat = bMaterial.map(function(o) {
								return o.number;
							}).indexOf(Model.getData()[j].number);
							if (indexOfMat !== undefined) {
								var bBatch = bMaterial[indexOfMat].batch;
								for (var k = 0; k < bBatch.length; k++) {
									var batchIndex = Model.getData()[j].batch.map(function(o) {
										return o.number;
									}).indexOf(bBatch[k].number);
									if (batchIndex == -1 || batchIndex === undefined) {
										Model.getData()[k].batch.push.apply(Model.getData()[k].batch, bBatch);
										//initial selected Batch
										var length = Model.getData()[k].batch.length - 1;
										var selectedBatch = [{
											number: Model.getData()[j].batch[length].number,
											gr: Model.getData()[j].ordered
										}];
										Model.getData()[k].batch.push.apply(Model.getData()[k].selectedBatch, selectedBatch);
										Model.getData()[k].selectedKey = Model.getData()[j].batch[length].number;
									}
								}
							}
						}

					} else {
						oCol.setVisible(false);
						this.getView().byId("col-list").setType("Inactive");
					}
					oToolbar.setText("Items (" + oModel.getData()[i].items[0].material.length + ")");
					oTable.setModel(Model);
					isFound = true;
				}

			}
			if (isFound === false) {
				oTable.removeAllItems(true);
				oToolbar.setText("Items (0)");
				sap.m.MessageToast.show("ID of Tag not found");
			}
		},
		_onPageNavButtonPress: function(oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("LandingPage", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		doNavigate: function(sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {

			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

			var sEntityNameSet;
			if (sPath !== null && sPath !== "") {
				if (sPath.substring(0, 1) === "/") {
					sPath = sPath.substring(1);
				}
				sEntityNameSet = sPath.split("(")[0];
			}
			var sNavigationPropertyName;
			var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;

			if (sEntityNameSet !== null) {
				sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet,
					sRouteName);
			}
			if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
				if (sNavigationPropertyName === "") {
					this.oRouter.navTo(sRouteName, {
						context: sPath,
						masterContext: sMasterContext
					}, false);
				} else {
					oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function(bindingContext) {
						if (bindingContext) {
							sPath = bindingContext.getPath();
							if (sPath.substring(0, 1) === "/") {
								sPath = sPath.substring(1);
							}
						} else {
							sPath = "undefined";
						}

						// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
						if (sPath === "undefined") {
							this.oRouter.navTo(sRouteName);
						} else {
							this.oRouter.navTo(sRouteName, {
								context: sPath,
								masterContext: sMasterContext
							}, false);
						}
					}.bind(this));
				}
			} else {
				this.oRouter.navTo(sRouteName);
			}

			if (typeof fnPromiseResolve === "function") {
				fnPromiseResolve();
			}
		},
		_onButtonPress: function(oEvent) {

			var sDialogName = "Dialog3";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
			var oSource = oEvent.getSource();
			var oBindingContext = oSource.getBindingContext();
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oView;
			if (!oDialog) {
				this.getOwnerComponent().runAsOwner(function() {
					oView = sap.ui.xmlview({
						viewName: "com.sap.build.standard.dbiB1Wm012GrToTempCopy.view." + sDialogName
					});
					this.getView().addDependent(oView);
					oView.getController().setRouter(this.oRouter);
					oDialog = oView.getContent()[0];
					this.mDialogs[sDialogName] = oDialog;
				}.bind(this));
			}

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterOpen", null, fnResolve);
				oDialog.open();
				if (oView) {
					oDialog.attachAfterOpen(function() {
						oDialog.rerender();
					});
				} else {
					oView = oDialog.getParent();
				}

				var oModel = this.getView().getModel();
				if (oModel) {
					oView.setModel(oModel);
				}
				if (sPath) {
					var oParams = oView.getController().getBindingParameters();
					oView.bindObject({
						path: sPath,
						parameters: oParams
					});
				}
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onTableDelete: function(oEvent) {

			var oSource = oEvent.getParameter("listItem");
			var oSourceBindingContext = oSource.getBindingContext();

			return new Promise(function(fnResolve, fnReject) {
				if (oSourceBindingContext) {
					var oModel = oSourceBindingContext.getModel();
					oModel.remove(oSourceBindingContext.getPath(), {
						success: function() {
							oModel.refresh();
							fnResolve();
						},
						error: function() {
							oModel.refresh();
							fnReject(new Error("remove failed"));
						}
					});
				} else {
					oSource.getParent().removeItem(oSource);
				}
			}).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		dialog2Close: function(oEvent) {
			this.getView().byId("dialog2").close();
		},
		dialog3Close: function(oEvent) {
			this.getView().byId("dialog3").close();
		},
		callDialogNote: function(oEvent) {
			var oView = this.getView();
			var sDialogName = "Dialog3";
			var oDialog = oView.byId("dialog3");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "com.sap.build.standard.dbiB1Wm012GrToTempCopy.view." + sDialogName, this.getView().getController());
				oView.addDependent(oDialog);
			}
			oDialog.open();
		},
		callDialog2: function(oEvent) {
			var oView = this.getView();
			var sDialogName = "Dialog2";
			var oDialog = oView.byId("dialog2");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "com.sap.build.standard.dbiB1Wm012GrToTempCopy.view." + sDialogName, this.getView().getController());
				oView.addDependent(oDialog);
			}
			oDialog.open();
			var tagId = this.getView().byId("tagid").getValue();
			var accass = "";
			var oModel = new sap.ui.model.json.JSONModel();
			if (tagId !== "") {
				for (var i = 0; i < this.getView().getModel("tags").getData().tags.length; i++) {
					if (this.getView().getModel("tags").getData().tags[i].id == tagId) {
						accass = this.getView().getModel("tags").getData().tags[i].accassignment;
					}
				}
				if (accass !== undefined || accass !== "") {
					oModel.setData(accass);
					this.getView().byId("dialog2").setModel(oModel);
				}
			}
		},
		openBatchDialog: function(oEvent) {

		},
		callFragment: function(oEvent) {

			var oView = this.getView();
			var sDialogName = "Dialog14";
			var oDialog = oView.byId("dialog14");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "com.sap.build.standard.dbiB1Wm012GrToTempCopy.view." + sDialogName, this.getView().getController());
				oView.addDependent(oDialog);
			}

			oDialog.open();
			var selectedValue = oEvent.getSource().getBindingContext("items").getObject();
			var indexOfSelected = oEvent.getSource().getBindingContext("items").getPath().replace("/", "");
			var matHeader = {
				number: selectedValue.MaterialNo,
				description: selectedValue.MaterialDesc,
				ordered: selectedValue.OrderQuantity,
				uom: selectedValue.OrderUom,
				batch: selectedValue.batchlist,
				indexOfSelected: indexOfSelected
			};
			debugger;
			var Model = new sap.ui.model.json.JSONModel();
			var mTableModel = new sap.ui.model.json.JSONModel();
			Model.setData(matHeader);
			var mTable = {
				batch: []
			};
			for (var i = 0; i < selectedValue.selectedBatch.length; i++) {
				mTable.batch.push(selectedValue.selectedBatch[i]);
			}
			// var mTable = {
			// 	batch: [{
			// 		number: selectedValue.selectedKey,
			// 		gr: selectedValue.CfmQuantity
			// 	}]
			// };
			if (mTable.batch.length == 1) {
				mTable.batch[0].gr = selectedValue.CfmQuantity;
			}
			mTableModel.setData(mTable);
			this.getView().byId("batchTable").setModel(mTableModel, "mtable");

			if (this.getView().byId("batchTable").getModel("mtable") === undefined && this.previousModel == "") {
				this.getView().byId("batchTable").setModel(mTableModel, "mtable");
				this.previousModel = JSON.parse(JSON.stringify(mTable));
			}
			//else {
			// 	if (this.previousModel.batch.length == 1) {
			// 		var previousData = this.previousModel.batch[0].number;
			// 		var previousGr = this.previousModel.batch[0].gr;
			// 		if (previousData !== selectedValue.selectedKey || previousGr !== selectedValue.CfmQuantity) {
			// 			this.getView().byId("batchTable").setModel(mTableModel, "mtable");
			// 		}
			// 	}
			// }
			this.getView().setModel(Model, "dialog");
			// this.getView().byId("stepinp").setValue(selectedValue.CfmQuantity);
			var jdata = this.getView().byId("batchTable").getModel("mtable").getData();
			this.previousModel = JSON.parse(JSON.stringify(jdata));
		},
		grChange: function(oEvent) {
			debugger;
			var totalval = 0;
			var items = this.getView().byId("batchTable").getItems();
			var maxOrdered = parseInt(this.getView().getModel("dialog").getData().ordered);
			var currentID = oEvent.getSource().getId();
			var currentVal = parseInt(oEvent.getSource().getValue());
			var oldVal = oEvent.getSource()._lastValue;
			for (var i = 0; i < items.length; i++) {
				totalval = totalval + parseInt(items[i].getCells()[1].getValue());
			}
			if (totalval > maxOrdered) {
				sap.ui.getCore().byId(currentID).setValue(oldVal);
				sap.m.MessageToast.show("Maximum ordered reached.");
			}
		},
		onAdd: function(oEvent) {
			var mTable = this.getView().byId("batchTable");
			var mModel = new sap.ui.model.json.JSONModel();
			var max = this.getView().getModel("dialog").getData().ordered;
			var cModel = this.getView().byId("batchTable").getModel("mtable").getData();
			if (mTable.getItems().length < this.getView().getModel("dialog").getData().batch.length) {
				cModel.batch.push({
					number: "",
					gr: 0
				});
				mModel.setData(cModel);
				mTable.setModel(mModel, "mtable");
			} else {
				sap.m.MessageToast.show("Maximum possible Batch entry reached!.");
			}

		},
		afterClose: function(oEvent) {

		},
		onOK: function(oEvent) {
			// var bVal = this.getView().byId("bCombo").getSelectedKey();
			// this.getView().byId("batchCombo").setSelectedKey(bVal);
			var validate = true;
			var validatedup = true;
			var val = new Array();
			var batchLength = this.getView().byId("batchTable").getItems().length;
			for (var i = 0; i < this.getView().byId("batchTable").getItems().length; i++) {
				if (this.getView().byId("batchTable").getItems()[i].mAggregations.cells[0].getValue() == "") {
					validate = false;
				}
				val.push(this.getView().byId("batchTable").getItems()[i].mAggregations.cells[0].getValue());
			}
			//Check Duplicate
			if (batchLength) {
				for (var i = 0; i < val.length; i++) {
					val.sort();
					var count = {};
					val.forEach(function(i) {
						count[i] = (count[i] || 0) + 1;
					});
					var number = count[val[i]];
					if (number > 1) {
						validate = false;
						validatedup = false;
					}
				}
			}
			if (validate == true) {
				debugger;
				if (this.getView().byId("batchTable").getItems().length > 0) {
					var indexOfSelected = parseInt(this.getView().getModel("dialog").getData().indexOfSelected);
					var oData = this.getView().byId("tagTable").getModel("items").getData()[indexOfSelected];
					var oTable = this.getView().byId("tagTable");
					var selectedVal = this.getView().byId("batchTable").getItems()[0].mAggregations.cells[0].getValue();
					if (batchLength > 1) {
						var totalGr = 0;
						var items = this.getView().byId("batchTable").getItems();
						for (var i = 0; i < items.length; i++) {
							totalGr = totalGr + parseInt(items[i].getCells()[1].getValue());
						}
						oData.selectedKey = selectedVal;
						oData.selectedBatch = [];
						oData.CfmQuantity = totalGr;
						var selectedBatch = this.getView().byId("batchTable").getModel("mtable").getData();
						for (var i = 0; i < selectedBatch.batch.length; i++) {
							oData.selectedBatch.push(selectedBatch.batch[i]);
						}

					} else {

						var selectedVal = this.getView().byId("batchTable").getItems()[0].mAggregations.cells[0].getValue();
						var selectedGr = parseInt(this.getView().byId("batchTable").getItems()[0].mAggregations.cells[1].getValue());
						oData.selectedKey = selectedVal;
						oData.CfmQuantity = selectedGr;
						oData.selectedBatch = [{
							number: selectedVal,
							gr: selectedGr
						}];
						// oData.selectedKey = selectedVal; 

					}
					// var oModel = new sap.ui.model.json.JSONModel();
					//Modify selected Data Item 
					// var data = [oData];
					// oModel.setData(data);
					// oTable.setModel(oModel, "items");
					this.getView().byId("tagTable").getBinding("items").refresh();
					this.getView().byId("dialog14").close();

				} else {
					sap.m.MessageToast.show("Please, specify atleast one batch.");
				}
			} else {
				if (validatedup == true) {
					sap.m.MessageToast.show("Empty batch are found.");
				} else {
					sap.m.MessageToast.show("Duplicated Batch are found.");
				}
			}
		},
		onDelete: function(oEvent) {
			var oTable = this.getView().byId("batchTable");
			var selected = oTable.getSelectedItems();
			var mModel = oTable.getModel("mtable").getData();
			var indexofSelect = -1;
			var delIndex = 0;
			for (var j = 0; j < oTable.getItems().length; j++) {
				if (oTable.getItems()[j].mProperties.selected == true) {
					indexofSelect = delIndex;
					if (indexofSelect !== -1) {
						mModel.batch.splice(indexofSelect, 1);
						delIndex = delIndex - 1;
					}
				}
				delIndex++;
			}
			// for (var i = 0; i < selected.length; i++) {

			// 	var batchValue = selected[i].mAggregations.cells[0].getValue();
			// 	var index = mModel.batch.map(function(o) {
			// 		return o.number;
			// 	}).indexOf(batchValue);
			// 	// mModel.remove(index);
			// 	// mModel.batch.splice(index, 1);

			// }
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(mModel);
			oTable.setModel(oModel, "mtable");
		},
		selectionChange: function(oVal) {

		},
		onCloseDialog: function() {
			var prevModel = new sap.ui.model.json.JSONModel();
			var index = this.getView().getModel("dialog").getData().indexOfSelected;
			debugger;
			prevModel.setData(this.previousModel);
			this.getView().byId("batchTable").setModel(prevModel, "mtable");
			this.getView().byId("tagTable").getModel("items").getData()[index].selectedBatch = this.previousModel.batch;
			this.getView().byId("dialog14").close();

		},
		_onRowPress: function(oEvent) {

			var sDialogName = "Dialog14";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
			var oSource = oEvent.getSource();
			var oBindingContext = oSource.getBindingContext();
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oView;
			if (!oDialog) {
				this.getOwnerComponent().runAsOwner(function() {
					oView = sap.ui.xmlview({
						viewName: "com.sap.build.standard.dbiB1Wm012GrToTempCopy.view." + sDialogName
					});
					this.getView().addDependent(oView);
					oView.getController().setRouter(this.oRouter);
					oDialog = oView.getContent()[0];
					this.mDialogs[sDialogName] = oDialog;
				}.bind(this));
			}

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterOpen", null, fnResolve);
				oDialog.open();
				if (oView) {
					oDialog.attachAfterOpen(function() {
						oDialog.rerender();
					});
				} else {
					oView = oDialog.getParent();
				}

				var oModel = this.getView().getModel();
				if (oModel) {
					oView.setModel(oModel);
				}
				if (sPath) {
					var oParams = oView.getController().getBindingParameters();
					oView.bindObject({
						path: sPath,
						parameters: oParams
					});
				}
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onObjectIdentifierTitlePress: function(oEvent) {

			//Cross app nav
			var cValue = oEvent.getSource().getTitle();
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					shellHash: "zpmow-zmmb004&/MaterialInformation/MaterialInfoSet(Material='" + cValue + "',Plant='')"
				}
			}));

			var url = window.location.href.split("#")[0] + hash;
			window.open(url);

			// var oBindingContext = oEvent.getSource().getBindingContext();

			// return new Promise(function(fnResolve) {

			// 	this.doNavigate("MaterialMasterInfoPage", oBindingContext, fnResolve, "");
			// }.bind(this)).catch(function(err) {
			// 	if (err !== undefined) {
			// 		MessageBox.error(err.message);
			// 	}
			// });

		},
		_onRowPress1: function(oEvent) {

			var sDialogName = "Dialog15";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
			var oSource = oEvent.getSource();
			var oBindingContext = oSource.getBindingContext();
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oView;
			if (!oDialog) {
				this.getOwnerComponent().runAsOwner(function() {
					oView = sap.ui.xmlview({
						viewName: "com.sap.build.standard.dbiB1Wm012GrToTempCopy.view." + sDialogName
					});
					this.getView().addDependent(oView);
					oView.getController().setRouter(this.oRouter);
					oDialog = oView.getContent()[0];
					this.mDialogs[sDialogName] = oDialog;
				}.bind(this));
			}

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterOpen", null, fnResolve);
				oDialog.open();
				if (oView) {
					oDialog.attachAfterOpen(function() {
						oDialog.rerender();
					});
				} else {
					oView = oDialog.getParent();
				}

				var oModel = this.getView().getModel();
				if (oModel) {
					oView.setModel(oModel);
				}
				if (sPath) {
					var oParams = oView.getController().getBindingParameters();
					oView.bindObject({
						path: sPath,
						parameters: oParams
					});
				}
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onObjectIdentifierTitlePress1: function(oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("MaterialMasterInfoPage", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		_onButtonPress1: function() {
			return new Promise(function(fnResolve) {
				sap.m.MessageBox.confirm("Are You sure to Clear All Items?", {
					title: "Clear All",
					actions: ["Confirm", "Cancel"],
					onClose: function(sActionClicked) {
						fnResolve(sActionClicked === "Confirm");
						if (sActionClicked == "Confirm") {
							var oTable = this.getView().byId("tagTable");
							var oToolbar = this.getView().byId("title-toolbar");
							var oInput = this.getView().byId("tagid");
							oTable.removeAllItems(true);
							oToolbar.setText("Items (0)");
							oInput.setValue("");
							this.getView().byId("note").setValue("");
						}
					}.bind(this)
				});
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err);
				}
			});

		},
		_onButtonPress2: function() {
			return new Promise(function(fnResolve) {
				var box = new sap.m.VBox({
					items: [
						new sap.m.Text({
							text: "Are you sure to confirm?"
						}),
						new sap.m.TextArea({
							value: '',
							cols: 80,
							rows: 4,
							placeholder: "Enter Note Here"
						}).addStyleClass('textarea')
					]
				});
				// box.setWidth("auto");
				// box.Height("auto");

				sap.m.MessageBox.confirm(box, {
					title: "Confirm",
					actions: ["Confirm", "Cancel"],
					onClose: function(sActionClicked) {
						fnResolve(sActionClicked === "Confirm");
						if (sActionClicked == "Confirm") {
							var oModel = new sap.ui.model.json.JSONModel();
							var ctagId = this.getView().byId("tagid").getValue();
							var tagModel = this.getView().getModel("tags");
							var tagData = tagModel.getData().tags;
							var index = tagData.map(function(o) {
								return o.id;
							}).indexOf(ctagId);
							if (index >= 0) {
								tagData.splice(index, 1);
							}
							var oTable = this.getView().byId("tagTable");
							var oToolbar = this.getView().byId("title-toolbar");
							var oInput = this.getView().byId("tagid");
							oTable.removeAllItems(true);
							oToolbar.setText("Items (0)");
							oInput.setValue("");
							this.getView().byId("note").setValue("");
							sap.m.MessageBox.success("Tag Number : " + ctagId + " is confirmed. ");
							// sap.m.MessageToast.show("Confirmed Tag Number : " + ctagId + " ");
							// this.getView().setModel();
						}
					}.bind(this)
				});
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err);
				}
			});

		},
		_onButtonPress3: function(oEvent) {

			var sDialogName = "Dialog2";
			this.mDialogs = this.mDialogs || {};
			var oDialog = this.mDialogs[sDialogName];
			var oSource = oEvent.getSource();
			var oBindingContext = oSource.getBindingContext();
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oView;
			if (!oDialog) {
				this.getOwnerComponent().runAsOwner(function() {
					oView = sap.ui.xmlview({
						viewName: "com.sap.build.standard.dbiB1Wm012GrToTempCopy.view." + sDialogName
					});
					this.getView().addDependent(oView);
					oView.getController().setRouter(this.oRouter);
					oDialog = oView.getContent()[0];
					this.mDialogs[sDialogName] = oDialog;
				}.bind(this));
			}

			return new Promise(function(fnResolve) {
				oDialog.attachEventOnce("afterOpen", null, fnResolve);
				oDialog.open();
				if (oView) {
					oDialog.attachAfterOpen(function() {
						oDialog.rerender();
					});
				} else {
					oView = oDialog.getParent();
				}

				var oModel = this.getView().getModel();
				if (oModel) {
					oView.setModel(oModel);
				}
				if (sPath) {
					var oParams = oView.getController().getBindingParameters();
					oView.bindObject({
						path: sPath,
						parameters: oParams
					});
				}
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		onInit: function() {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("GrByTag").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

		}
	});
}, /* bExport= */ true);