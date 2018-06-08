sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History"
], function(BaseController, MessageBox, Utilities, History) {
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
		tagChange: function(oEvent) {
			var tags = this.getView().getModel("tags").getProperty("/tags");
			var oModel = new sap.ui.model.json.JSONModel();
			var oTable = this.getView().byId("tagTable");
			var isFound = false;
			oModel.setData(tags);
			for (var i = 0; i < oModel.getData().length; i++) {
				if (oModel.getData()[i].id == oEvent.mParameters.value) {
					var orderType = oModel.getData()[i].items[0].type;
					var orderNo = oModel.getData()[i].items[0].order;
					var Model = new sap.ui.model.json.JSONModel();
					Model.setData(oModel.getData()[i].items[0].material);
					var oCol = this.getView().byId("col-batch");
					var oToolbar = this.getView().byId("title-toolbar");
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
										Model.getData()[j].batch.push.apply(Model.getData()[j].batch, bBatch);
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
			debugger;
			var selectedValue = oEvent.getSource().getBindingContext().getObject();
			this.selectedID = oEvent.getSource().mAggregations.cells[2].sId;
			this.selectedGr = oEvent.getSource().mAggregations.cells[3].sId;
			var matHeader = {
				number: selectedValue.number,
				description: selectedValue.description,
				ordered: selectedValue.ordered,
				uom: selectedValue.uom,
				batch: selectedValue.batch
			};
			var selectedBatch = oEvent.getSource().mAggregations.cells[2].getSelectedKey();
			// var selectedBatchVal = oEvent.getSource().mAggregations.cells[2].getValue();
			var selectedBatchVal = oEvent.getSource().mAggregations.cells[2].getSelectedItem().getText();
			// if(selectedBatchVal == "Multiple Batch"){
			// 	selectedBatchVal = "";
			// }
			// var selectedBatchVal = oEvent.getSource().mAggregations.cells[2].getSelectedItem().getText();
			var size = selectedValue.batch.length - 1;
			var Model = new sap.ui.model.json.JSONModel();
			var mTableModel = new sap.ui.model.json.JSONModel();
			Model.setData(matHeader);
			var mTable = {
				batch: [{
					number: selectedBatchVal,
					gr: selectedValue.gr,
					max: selectedValue.ordered
				}]
			};
			mTableModel.setData(mTable);

			if (this.getView().byId("batchTable").getModel("mtable") === undefined && this.previousModel == "") {
				this.getView().byId("batchTable").setModel(mTableModel, "mtable");
				// this.previousModel = mTable;
				// this.previousModel = Object.assign({},mTableModel);
				this.previousModel = JSON.parse(JSON.stringify(mTable));
			} else {
				if (this.previousModel.batch.length == 1) {
					var previousData = this.previousModel.batch[0].number;
					if (previousData !== selectedBatchVal) {
						this.getView().byId("batchTable").setModel(mTableModel, "mtable");
					}
				}
				// else {
				// 	var prevModel = new sap.ui.model.json.JSONModel();
				// 	var newMo = JSON.parse(JSON.stringify(this.previousModel));
				// 	prevModel.setData(newMo);
				// 	this.getView().byId("batchTable").setModel(prevModel, "mtable");
				// 	debugger;
				// }
				// var previousData = this.getView().byId("batchTable").getModel("mtable").getData().batch[0].number;
				// if (previousData !== selectedBatchVal) {
				// 	this.getView().byId("batchTable").setModel(mTableModel, "mtable");
				// }
			}
			this.getView().setModel(Model, "dialog");
			this.getView().byId("stepinp").setValue(selectedValue.gr);
			// this.getView().byId("stepinp").setMax(selectedValue.ordered);
			var index = selectedValue.batch.map(function(o) {
				return o.number;
			}).indexOf(selectedBatch);
			var jdata = this.getView().byId("batchTable").getModel("mtable").getData();
			this.previousModel = JSON.parse(JSON.stringify(jdata));
			// this.getView().byId("bCombo").setSelectedKey(selectedBatch);
			// this.getView().byId("bCombo").setValue(selectedBatchVal);

		},
		grChange: function(oEvent) {
			debugger;
			// var items = this.getView().byId("batchTable").getItems();
			// var maxOrdered = parseInt(this.getView().getModel("dialog").getData().ordered);
			// var currentID = oEvent.getSource().getId();
			// var currentVal = parseInt(oEvent.getSource().getValue());
			// var oldVal = oEvent.getSource()._sOldValue;
			// var totalval = 0;
			// for (var i = 0; i < items.length; i++) {
			// 	totalval = totalval + parseInt(items[i].getCells()[1].getValue());
			// }
			// if (totalval > maxOrdered) {
			// 	sap.ui.getCore().byId(currentID).setValue(oldVal);
			// 	var diff = currentVal - oldVal;
			// 	totalval = totalval - diff;
			// }
			// var maxdiff = maxOrdered - totalval;
			// if (maxdiff >= 0) {
			// 	for (var j = 0; j < items.length; j++) {
			// 		var id = items[j].getCells()[1].getId();
			// 		var currVal = parseInt(items[j].getCells()[1].getValue());
			// 		var currentInput = sap.ui.getCore().byId(id);
			// 		currentInput.setMax(currVal + maxdiff);
			// 	}
			// }

		},
		onAdd: function(oEvent) {
			var mTable = this.getView().byId("batchTable");
			var mModel = new sap.ui.model.json.JSONModel();
			var max = this.getView().getModel("dialog").getData().ordered;
			debugger;
			var cModel = this.getView().byId("batchTable").getModel("mtable").getData();
			cModel.batch.push({
				number: "",
				gr: 0,
				max: max
			});
			mModel.setData(cModel);
			mTable.setModel(mModel, "mtable");

		},
		afterClose: function(oEvent) {
			debugger;
			var selectedVal = this.getView().byId("batchTable").getItems()[0].mAggregations.cells[0].getValue();
			var selectedKey = "Item_" + this.getView().byId("batchTable").getItems()[0].mAggregations.cells[0].getValue();
			var selectedGr = parseInt(this.getView().byId("batchTable").getItems()[0].mAggregations.cells[1].getValue());
			var batchLength = this.getView().byId("batchTable").getItems().length;
			var sModel = this.getView().getModel("dialog").getData();
			var selectedRowcId = this.getView().byId("tagTable").getItems()[0].getCells()[2].sId;
			var selectedRowgId = this.getView().byId("tagTable").getItems()[0].getCells()[3].sId;
			var selectedIndex = sModel.batch.map(function(o) {
				return o.number;
			}).indexOf(selectedVal);
			var oItem = this.getView().byId("tagTable").getItems();
			if (batchLength > 1) {
				// sap.ui.getCore().byId(this.selectedID).setValue("Multiple Batch");
				var totalGr = 0;
				var items = this.getView().byId("batchTable").getItems();
				for (var i = 0; i < items.length; i++) {
					totalGr = totalGr + parseInt(items[i].getCells()[1].getValue());
				}
				sap.ui.getCore().byId(selectedRowcId).setEnabled(false);
				sap.ui.getCore().byId(selectedRowgId).setEnabled(false);
				sap.ui.getCore().byId(selectedRowgId).setValue(totalGr);
				this.previousModel = JSON.parse(JSON.stringify(this.getView().byId("batchTable").getModel("mtable").getData()));
			} else {
				sap.ui.getCore().byId(selectedRowcId).setEnabled(true);
				sap.ui.getCore().byId(selectedRowgId).setEnabled(true);
				
				sap.ui.getCore().byId(selectedRowcId).setSelectedItem(sap.ui.getCore().byId(selectedRowcId).getItems()[selectedIndex], true,
					true);
			
				sap.ui.getCore().byId(selectedRowgId).setValue(selectedGr);
			
				this.previousModel = JSON.parse(JSON.stringify(this.getView().byId("batchTable").getModel("mtable").getData()));
				
			}
		},
		onOK: function(oEvent) {
			// var bVal = this.getView().byId("bCombo").getSelectedKey();
			// this.getView().byId("batchCombo").setSelectedKey(bVal);
			// debugger;
			var validate = true;
			for (var i = 0; i < this.getView().byId("batchTable").getItems().length; i++) {
				if (this.getView().byId("batchTable").getItems()[i].mAggregations.cells[0].getValue() == "") {
					validate = false;
				}
			}
			if (validate == true) {
				if (this.getView().byId("batchTable").getItems().length > 0) {
					this.getView().byId("dialog14").close();
					// debugger;
					// // var selectedKey = this.getView().byId("batchTable").getItems()[0].mAggregations.cells[0].getSelectedKey();
					// var selectedVal = this.getView().byId("batchTable").getItems()[0].mAggregations.cells[0].getValue();
					// var selectedKey = "Item_" + this.getView().byId("batchTable").getItems()[0].mAggregations.cells[0].getValue();
					// var selectedGr = parseInt(this.getView().byId("batchTable").getItems()[0].mAggregations.cells[1].getValue());

					// // var batchLength = this.getView().byId("batchTable").getModel("mtable").getData().batch.length;
					// var batchLength = this.getView().byId("batchTable").getItems().length;
					// var sModel = this.getView().getModel("dialog").getData();
					// var selectedIndex = sModel.batch.map(function(o) {
					// 	return o.number;
					// }).indexOf(selectedVal);
					// var oItem = this.getView().byId("tagTable").getItems();
					// if (batchLength > 1) {
					// 	// sap.ui.getCore().byId(this.selectedID).setValue("Multiple Batch");
					// 	var totalGr = 0;
					// 	var items = this.getView().byId("batchTable").getItems();
					// 	for (var i = 0; i < items.length; i++) {
					// 		totalGr = totalGr + parseInt(items[i].getCells()[1].getValue());
					// 	}
					// 	sap.ui.getCore().byId(this.selectedID).setEnabled(false);
					// 	sap.ui.getCore().byId(this.selectedGr).setEnabled(false);
					// 	sap.ui.getCore().byId(this.selectedGr).setValue(totalGr);
					// 	this.previousModel = JSON.parse(JSON.stringify(this.getView().byId("batchTable").getModel("mtable").getData()));
					// 	// this.getView().byId("batchCombo").setEnabled(false);
					// 	// this.getView().byId("taggrinput").setEnabled(false);
					// 	this.getView().byId("dialog14").close();
					// 	// this.getView().byId("batchCombo").setEnabled(false);
					// 	// this.getView().byId("taggrinput").setEnabled(false);
					// } else {
					// 	sap.ui.getCore().byId(this.selectedID).setEnabled(true);
					// 	sap.ui.getCore().byId(this.selectedGr).setEnabled(true);
					// 	// sap.ui.getCore().byId(this.selectedID).setSelectedKey(selectedVal);
					// 	sap.ui.getCore().byId(this.selectedID).setSelectedItem(sap.ui.getCore().byId(this.selectedID).getItems()[selectedIndex], true,
					// 		true);
					// 	// sap.ui.getCore().byId(this.selectedID).setValue(selectedVal);
					// 	// sap.ui.getCore().byId(this.selectedID).setSelectedIndex(selectedIndex);
					// 	sap.ui.getCore().byId(this.selectedGr).setValue(selectedGr);
					// 	// this.getView().byId("batchCombo").setSelectedIndex(selectedIndex);
					// 	// this.getView().byId("batchCombo").setValue(selectedVal);
					// 	// this.getView().byId("taggrinput").setValue(selectedGr);
					// 	// this.getView().byId("batchCombo").setEnabled(true);
					// 	// this.getView().byId("taggrinput").setEnabled(true);
					// 	this.previousModel = JSON.parse(JSON.stringify(this.getView().byId("batchTable").getModel("mtable").getData()));
					// 	this.getView().byId("dialog14").close();
					// 	// this.getView().byId("batchCombo").setSelectedIndex(selectedIndex);
					// 	// this.getView().byId("batchCombo").setValue(selectedVal);
					// 	// this.getView().byId("taggrinput").setValue(selectedGr);
					// 	// this.getView().byId("batchCombo").setEnabled(true);
					// 	// this.getView().byId("taggrinput").setEnabled(true);
					// }
					// // this.getView().setModel(this.getView().byId("batchTable").getModel("mtable"),"prevModel");
					// // this.previousModel = Object.assign({},this.getView().byId("batchTable").getModel("mtable"));
					// // this.previousModel = JSON.parse(JSON.stringify(this.getView().byId("batchTable").getModel("mtable").getData()));
				} else {
					sap.m.MessageToast.show("Please, specify atleast one batch.");
				}
			} else {
				sap.m.MessageToast.show("Empty batch are found.");
			}
		},
		onDelete: function(oEvent) {
			var oTable = this.getView().byId("batchTable");
			var selected = oTable.getSelectedItems();
			var mModel = oTable.getModel("mtable").getData();

			for (var i = 0; i < selected.length; i++) {

				var batchValue = selected[i].mAggregations.cells[0].getValue();
				var index = mModel.batch.map(function(o) {
					return o.number;
				}).indexOf(batchValue);
				debugger;
				// mModel.remove(index);
				mModel.batch.splice(index, 1);

			}
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(mModel);
			oTable.setModel(oModel, "mtable");
			debugger;
		},
		selectionChange: function(oVal) {

		},
		onCloseDialog: function() {
			debugger;
			var prevModel = new sap.ui.model.json.JSONModel();
			prevModel.setData(this.previousModel);
			this.getView().byId("batchTable").setModel(prevModel, "mtable");
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

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function(fnResolve) {

				this.doNavigate("MaterialMasterInfoPage", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

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
					}
				});
			}).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err);
				}
			});

		},
		_onButtonPress2: function() {
			return new Promise(function(fnResolve) {
				sap.m.MessageBox.confirm("Are you sure to Confirm?", {
					title: "Confirm",
					actions: ["Confirm", "Cancel"],
					onClose: function(sActionClicked) {
						fnResolve(sActionClicked === "Confirm");
					}
				});
			}).catch(function(err) {
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