import React from "react";
import { FlatList, ScrollView, View, ViewPropTypes } from "react-native";
import PropTypes from "prop-types";
import * as Animatable from "react-native-animatable";
class Item extends React.PureComponent {
	render() {
		return <Animatable.View
			animation={this.props.itemProperties.animation}
			delay={this.props.itemProperties.delay}
			duration={this.props.itemProperties.duration}
			iterationCount={this.props.itemProperties.iterationCount}
			useNativeDriver={true}
		>
			<View style={{ flex: 1 }} onLayout={this.props.onLayout}>
				{this.props.renderItem(this.props.item)}
			</View>
		</Animatable.View>
	}
}

class Column extends React.Component {
	static propTypes = {
		keyExtractor: PropTypes.func
	};

	constructor(props) {
		super(props);
		this.state = {
			height: 0,
			data: []
		};
	}

	clear() {
		this.setState({ data: [], height: 0 });
	}

	render() {
		return <View style={{ flex: 1, overflow: "hidden" }}>
			<FlatList
				style={{ flex: 1 }}
				data={this.state.data}
				keyExtractor={this.props.keyExtractor}
				renderItem={this.renderItem.bind(this)}
			/>
		</View>
	}

	getHeight() {
		return this.state.height;
	}

	addItems(items) {
		this.setState({ data: [...this.state.data, ...items] });
	}

	renderItem({ item }) {
		return <Item renderItem={this.props.renderItem} item={item} itemProperties={this.props.itemProperties} onLayout={(event) => {
			const { height } = event.nativeEvent.layout;
			this.state.height = this.state.height + height;
			this.setState({ height: this.state.height });
			item.onLayout && item.onLayout();
		}} />
	}
}

export default class Masonry extends React.Component {

	static propTypes = {
		columns: PropTypes.number,
		containerStyle: ViewPropTypes.style,
		style: ViewPropTypes.style,
		renderItem: PropTypes.func,
		keyExtractor: PropTypes.func,
		itemProperties: PropTypes.object
	};

	static defaultProps = {
		columns: 2
	};

	constructor(props) {
		super(props);
		const columns = [];
		for (let i = 0; i < props.columns; i++) {
			columns.push(null);
		}
		this.state = {
			columns
		};
		this.itemQueue = [];
	}

	clear() {
		this.state.columns.forEach(col => col.clear());
	}

	addItems(items) {
		if (items) {
			if (this.itemQueue.length > 0) {
				this.itemQueue = this.itemQueue.concat(items);
			} else {
				this.itemQueue = this.itemQueue.concat(items);
				this.addItems();
			}
		} else {
			if (this.itemQueue.length > 0) {
				const item = this.itemQueue.shift();
				this.addItem(item, () => this.addItems());
			}
		}
	}

	addItemsWithHeight(items) {
		const columns = this.sortColumns().map(col => {
			return {
				column: col,
				height: col.getHeight(),
				data: []
			}
		});

		items.forEach((item) => {
			const col = columns.sort((a, b) => a.height - b.height)[0];
			col.data.push(item);
			col.height += item.height;
		});

		// 批量添加 Column 的 Items
		columns.forEach(col => {
			col.column.addItems(col.data);
		})
	}

	/**
	 * 
	 * @returns {Array}
	 */
	sortColumns() {
		return this.state.columns.sort((a, b) => a.getHeight() - b.getHeight());
	}

	addItem(item, callback) {
		const minCol = this.sortColumns()[0];
		item.onLayout = callback;
		minCol.addItems([item]);
	}

	render() {
		return <ScrollView {...this.props}>
			{this.props.header}
			<View style={[{ flexDirection: "row" }, this.props.containerStyle]}>
				{this.state.columns.map((col, index) => {
					return <Column key={index} ref={(ref) => this.state.columns[index] = ref}
						keyExtractor={this.props.keyExtractor}
						renderItem={this.props.renderItem.bind(this)}
						itemProperties={this.props.itemProperties} />
				})}
			</View>
			{this.props.footer}
		</ScrollView>
	}

}