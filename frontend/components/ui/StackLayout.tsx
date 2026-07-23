import { Children } from "react";

export default function StackLayout({ children }: { children: React.ReactNode }) {
	const count = Children.count(children);

	return <div className="fixed right-2 bottom-2">
		{ Children.map(children, (child, i) => {
			return <div style={{
				transitionDuration: "0.15s",
				scale: `${100 - ((count - (i + 1)) * 2)}%`,
				translate: `0 -${(count - (i + 1)) * 4}px`
			}} className="w-120">{child}</div>
		}) }
	</div>;
}
