sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, MessageBox, Utilities, History, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("com.sap.build.standard.dbiB1Wm012GrToTempCopy.controller.GrFromPo", {
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
		dialog3Close: function(oEvent) {
			this.getView().byId("dialog3-2").close();
		},
		callDialogNote: function(oEvent) {
			var oView = this.getView();
			var sDialogName = "Dialog3-2";
			var oDialog = oView.byId("dialog3-2");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "com.sap.build.standard.dbiB1Wm012GrToTempCopy.view." + sDialogName, this.getView().getController());
				oView.addDependent(oDialog);
			}
			oDialog.open();
		},
		poInput: function(oEvent) {
			this.username = sap.ushell.Container.getUser().getFullName();
			var url = this.getView().getModel().sServiceUrl;
			var oModel = new sap.ui.model.odata.v2.ODataModel(url, true);
			this.oTable = this.getView().byId("oTable");
			this.oHeaderModel = new sap.ui.model.json.JSONModel();
			this.oItemsModel = new sap.ui.model.json.JSONModel();
			var value = oEvent.getSource().getValue();
			var sGroup = jQuery.sap.uid();
			var sGroup2 = jQuery.sap.uid() + "2";
			oModel.setDeferredGroups([sGroup]);
			//Read Header
			oModel.read("/PurchRecvHeaderSet('" + value + "')", {
				groupId: sGroup
			});
			//Read Items
			oModel.read("/PurchRecvHeaderSet('" + value + "')/Items", {
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
					if (this.username) {
						this.getView().byId("grep").setValue(this.username);
					}
					//if not found
					if (statusCode !== "404") {
						this.oDataHeader = oResponse.__batchResponses[0].data;
						this.oHeaderModel.setData(this.oDataHeader);
						this.oDataItems = oResponse.__batchResponses[1].data.results;
						for (var i = 0; i < this.oDataItems.length; i++) {
							this.oDataItems[i].CfmQuantity = this.oDataItems[i].BaseQuantity;
							this.oDataItems[i].CfmUom = this.oDataItems[i].BaseUom;
						}
						this.oItemsModel.setData(this.oDataItems);
						oModel.setDeferredGroups([sGroup2]);
						//Read Alternate UoM

						for (var i = 0; i < this.oDataItems.length; i++) {
							var filters = [];
							filters.push(new Filter("Matnr", FilterOperator.EQ, "'" + this.oDataItems[i].MaterialNo + "'"));
							oModel.read("/AlternateUomSet", {
								groupId: sGroup2,
								filters: filters
							});
						}

						oModel.submitChanges({
							groupId: sGroup2,
							success: function(oUom) {
								for (var j = 0; j < this.oDataItems.length; j++) {
									var size = oUom.__batchResponses[j].data.results.length - 1;
									this.oItemsModel.getData()[j].uomlist = oUom.__batchResponses[j].data.results;
								}
								this.getView().setModel(this.oHeaderModel, "header");
								this.getView().byId("oTable").setModel(this.oItemsModel, "items");
								this.getView().byId("vendorHeader").setVisible(true);
							}.bind(this)
						});
						//Not found material
					} else {
						var headerModel = this.getView().getModel("header");
						var itemModel = this.getView().byId("oTable").getModel("items");
						if (headerModel && itemModel) {
							headerModel.setData(null);
							headerModel.updateBindings(true);
							itemModel.setData(null);
							itemModel.updateBindings(true);
						}
						this.getView().byId("vendorHeader").setVisible(false);
						sap.m.MessageToast.show("PO Not Found.");
					}
				}.bind(this)
			});

		},
		poChange: function(oEvent) {
			var po = this.getView().getModel("po").getProperty("/PO");
			var oModel = new sap.ui.model.json.JSONModel();
			var data;
			for (var i = 0; i < po.length; i++) {
				if (oEvent.getSource().getValue() == po[i].number) {
					data = po[i];
				}
			}
			if (data !== undefined) {
				oModel.setData(data);
				this.getView().setModel(oModel);
				this.getView().byId("vendorHeader").setVisible(true);
				this.getView().byId("toolbar").setText("Items (" + data.items.length + ")");
			} else {
				sap.m.MessageToast.show("PO number not found.");
			}
		},
		dialog2Close: function(oEvent) {
			this.getView().byId("dialog2").close();
		},
		callDialog2: function(oEvent) {
			var oView = this.getView();
			var sDialogName = "Dialog2";
			var po = this.getView().getModel("po").getProperty("/PO");
			var oDialog = oView.byId("dialog2");
			// create dialog lazily
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "com.sap.build.standard.dbiB1Wm012GrToTempCopy.view." + sDialogName, this.getView().getController());
				oView.addDependent(oDialog);
			}
			oDialog.open();
			var poId = this.getView().byId("poinput").getValue();
			var accass = "";
			var oModel = new sap.ui.model.json.JSONModel();
			if (poId !== "") {
				for (var i = 0; i < po.length; i++) {
					if (po[i].number == poId) {
						accass = po[i].accassignment;
					}
				}
				if (accass !== undefined || accass !== "") {
					oModel.setData(accass);
					this.getView().byId("dialog2").setModel(oModel);
				}
			}
		},
		grChange: function(oEvent) {
			var current_val = oEvent.getSource().getValue();
			var current_rem = oEvent.getSource().getParent().getCells()[3].getNumber();
			var current_item = oEvent.getSource().getParent().getCells()[0].getText();
			var oldVal = oEvent.getSource()._lastValue;
			var current_id = oEvent.getSource().getId();
			var sPath = oEvent.getSource().getParent().getBindingContext().sPath;
			var parent = oEvent.getSource().getParent().getBindingContext().getObject();
			if (current_val > current_rem) {
				// sap.ui.getCore().byId(current_id).setValue(oldVal);         

				var parentModel = oEvent.getSource().getParent().getBindingContext().getModel();
				var items = parentModel.getData().items;
				// for (var i = 0; i < items.length; i++{
				var index = items.map(function(o) {
					return o.line;
				}).indexOf(current_item);

				parent.goodreceive = oldVal;
				// }
			} else {
				// sap.ui.getCore().byId(current_id).setValue(current_val); 
				parent.goodreceive = current_val;
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

			var sDialogName = "Dialog4";
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
		_onButtonPress1: function(oEvent) {

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
			var freshModel = new sap.ui.model.json.JSONModel();
			var items = oSourceBindingContext.getModel().getData().items;
			var currLine = oSourceBindingContext.getProperty("line");
			var index = items.map(function(o) {
				return o.line;
			}).indexOf(currLine);
			if (index >= 0) {
				items.splice(index, 1);
			}
			this.getView().byId("toolbar").setText("Items (" + items.length + ")");
			oSourceBindingContext.getModel().refresh();

			// return new Promise(function(fnResolve, fnReject) {
			// 	if (oSourceBindingContext) {
			// 		var oModel = oSourceBindingContext.getModel();
			// 		var data = oModel.getData();
			// 		// oModel.remove(oSourceBindingContext.getPath(), {
			// 		// 	success: function() {
			// 		// 		oModel.refresh();
			// 		// 		fnResolve();
			// 		// 	},
			// 		// 	error: function() {
			// 		// 		oModel.refresh();
			// 		// 		fnReject(new Error("remove failed"));
			// 		// 	}
			// 		// });

			// 	} else {
			// 		oSource.getParent().removeItem(oSource);
			// 	}
			// }.bind(this)).catch(function(err) {
			// 	if (err !== undefined) {
			// 		MessageBox.error(err.message);
			// 	}
			// });

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
		_onButtonPress2: function() {
			return new Promise(function(fnResolve) {
				sap.m.MessageBox.confirm("Are You sure to Clear All Items?", {
					title: "Clear All",
					actions: ["Confirm", "Cancel"],
					onClose: function(sActionClicked) {
						fnResolve(sActionClicked === "Confirm");
						if (sActionClicked == "Confirm") {
							this.getView().byId("poTable").removeAllItems(true);
							this.getView().byId("vendorHeader").setVisible(false);
							this.getView().byId("poinput").setValue("");
							this.getView().byId("toolbar").setText("Items (0)");
							this.getView().byId("note").setValue("");
							this.getView().byId("dialog2").getModel().setData({}).refresh();
							// this.getView().byId("poinput").setText("");

						}
					}.bind(this)
				});
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err);
				}
			});

		},
		_onButtonPress3: function() {

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
				sap.m.MessageBox.confirm(box, {
					title: "Confirm",
					actions: ["Confirm", "Cancel"],
					onClose: function(sActionClicked) {
						fnResolve(sActionClicked === "Confirm");
						if (sActionClicked == "Confirm") {
							var POList = this.getView().getModel("po").getData().PO;
							var cPOno = this.getView().getModel().getData().number;
							var index = POList.map(function(o) {
								return o.number;
							}).indexOf(cPOno);
							if (index >= 0) {
								POList.splice(index, 1);
							}
							this.getView().getModel("po").refresh();
							this.getView().byId("poTable").removeAllItems(true);
							this.getView().byId("vendorHeader").setVisible(false);
							this.getView().byId("poinput").setValue("");
							this.getView().byId("toolbar").setText("Items (0)");
							this.getView().byId("note").setValue("");
							sap.m.MessageBox.success("PO Number : " + cPOno + " is confirmed.");
							// sap.m.MessageToast.show("PO Number : " + cPOno + " was confirmed.");
							this.getView().byId("dialog2").getModel().setData({}).refresh();
							// sap.m.MessageBox.information("PO Number : " + cPOno + " was confirmed.);

							// this.getView().byId("poinput").setText("");

						}
					}.bind(this)
				});
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err);
				}
			});

		},
		_onButtonPress4: function(oEvent) {

			var sDialogName = "Dialog4";
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
			this.oRouter.getTarget("GrFromPo").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));

		}
	});
}, /* bExport= */ true);