
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Naming.svelte generated by Svelte v3.46.4 */

    const file = "src/components/Naming.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	return child_ctx;
    }

    // (70:8) {#each computerTypes as type}
    function create_each_block_1(ctx) {
    	let option;
    	let t_value = /*type*/ ctx[19].type + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*type*/ ctx[19].id;
    			option.value = option.__value;
    			add_location(option, file, 70, 8, 2393);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(70:8) {#each computerTypes as type}",
    		ctx
    	});

    	return block;
    }

    // (87:8) {#each squadrons as sq}
    function create_each_block(ctx) {
    	let option;
    	let t_value = /*sq*/ ctx[16].name + "";
    	let t;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = /*sq*/ ctx[16].id;
    			option.value = option.__value;
    			add_location(option, file, 87, 8, 2925);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(87:8) {#each squadrons as sq}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let h1;
    	let t1;
    	let div11;
    	let div10;
    	let div1;
    	let label0;
    	let div0;
    	let span0;
    	let t3;
    	let select0;
    	let t4;
    	let div3;
    	let label1;
    	let div2;
    	let span1;
    	let t6;
    	let select1;
    	let t7;
    	let div5;
    	let label2;
    	let div4;
    	let span2;
    	let t9;
    	let input0;
    	let t10;
    	let div7;
    	let span3;
    	let t12;
    	let label3;
    	let div6;
    	let span4;
    	let t14;
    	let input1;
    	let t15;
    	let div9;
    	let label4;
    	let div8;
    	let span5;
    	let t17;
    	let input2;
    	let t18;
    	let div16;
    	let div15;
    	let div14;
    	let div12;
    	let t20;
    	let div13;
    	let t21_value = /*finalName*/ ctx[4].toUpperCase() + "";
    	let t21;
    	let t22;
    	let div17;
    	let label5;
    	let t24;
    	let input3;
    	let t25;
    	let label7;
    	let label6;
    	let h3;
    	let t27;
    	let p0;
    	let t29;
    	let b0;
    	let t31;
    	let p1;
    	let t33;
    	let b1;
    	let t35;
    	let p2;
    	let t37;
    	let b2;
    	let t39;
    	let p3;
    	let t41;
    	let b3;
    	let t43;
    	let p4;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*computerTypes*/ ctx[5];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*squadrons*/ ctx[6];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Cannon AFB Naming Convention";
    			t1 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div1 = element("div");
    			label0 = element("label");
    			div0 = element("div");
    			span0 = element("span");
    			span0.textContent = "Computer type";
    			t3 = space();
    			select0 = element("select");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t4 = space();
    			div3 = element("div");
    			label1 = element("label");
    			div2 = element("div");
    			span1 = element("span");
    			span1.textContent = "Squadron";
    			t6 = space();
    			select1 = element("select");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			div5 = element("div");
    			label2 = element("label");
    			div4 = element("div");
    			span2 = element("span");
    			span2.textContent = "Serial";
    			t9 = space();
    			input0 = element("input");
    			t10 = space();
    			div7 = element("div");
    			span3 = element("span");
    			span3.textContent = "System Image";
    			t12 = space();
    			label3 = element("label");
    			div6 = element("div");
    			span4 = element("span");
    			span4.textContent = "SDC";
    			t14 = space();
    			input1 = element("input");
    			t15 = space();
    			div9 = element("div");
    			label4 = element("label");
    			div8 = element("div");
    			span5 = element("span");
    			span5.textContent = "EDC";
    			t17 = space();
    			input2 = element("input");
    			t18 = space();
    			div16 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			div12 = element("div");
    			div12.textContent = "Name:";
    			t20 = space();
    			div13 = element("div");
    			t21 = text(t21_value);
    			t22 = space();
    			div17 = element("div");
    			label5 = element("label");
    			label5.textContent = "View Naming Convention";
    			t24 = space();
    			input3 = element("input");
    			t25 = space();
    			label7 = element("label");
    			label6 = element("label");
    			h3 = element("h3");
    			h3.textContent = "Cannon AFB Naming Convention";
    			t27 = space();
    			p0 = element("p");
    			p0.textContent = "The name is split up into 4 parts:";
    			t29 = space();
    			b0 = element("b");
    			b0.textContent = "Identifier:";
    			t31 = space();
    			p1 = element("p");
    			p1.textContent = "For Cannon this is CZQZ";
    			t33 = space();
    			b1 = element("b");
    			b1.textContent = "Computer Type:";
    			t35 = space();
    			p2 = element("p");
    			p2.textContent = "W, L, or T for workstation, laptop, or tablet";
    			t37 = space();
    			b2 = element("b");
    			b2.textContent = "Squadron:";
    			t39 = space();
    			p3 = element("p");
    			p3.textContent = "An abbreviated version of the squadron the computer belongs in";
    			t41 = space();
    			b3 = element("b");
    			b3.textContent = "Serial:";
    			t43 = space();
    			p4 = element("p");
    			p4.textContent = "The remaining spaces are filled with the beginning or end of the serial,\r\n      for EDC and SDC respectively";
    			attr_dev(h1, "class", "text-center text-2xl font-bold mt-10");
    			add_location(h1, file, 52, 0, 1777);
    			attr_dev(span0, "class", "label-text");
    			add_location(span0, file, 64, 10, 2190);
    			attr_dev(div0, "class", "tooltip tooltip-primary tooltip-right");
    			attr_dev(div0, "data-tip", "What type of computer it is");
    			add_location(div0, file, 60, 8, 2056);
    			attr_dev(label0, "class", "label");
    			attr_dev(label0, "for", "computer");
    			add_location(label0, file, 59, 6, 2010);
    			attr_dev(select0, "class", "select select-bordered");
    			if (/*selectedType*/ ctx[1] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[10].call(select0));
    			add_location(select0, file, 68, 6, 2277);
    			attr_dev(div1, "class", "form-control w-full max-w-xs");
    			add_location(div1, file, 58, 4, 1960);
    			attr_dev(span1, "class", "label-text");
    			add_location(span1, file, 81, 10, 2735);
    			attr_dev(div2, "class", "tooltip tooltip-primary tooltip-right");
    			attr_dev(div2, "data-tip", "Which Squadron the computer is going to");
    			add_location(div2, file, 77, 9, 2589);
    			attr_dev(label1, "class", "label");
    			attr_dev(label1, "for", "squadron");
    			add_location(label1, file, 76, 6, 2543);
    			attr_dev(select1, "class", "select select-bordered");
    			if (/*selectedSQ*/ ctx[2] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[11].call(select1));
    			add_location(select1, file, 85, 6, 2817);
    			attr_dev(div3, "class", "form-control w-full max-w-xs");
    			add_location(div3, file, 75, 4, 2493);
    			attr_dev(span2, "class", "label-text");
    			add_location(span2, file, 98, 10, 3252);
    			attr_dev(div4, "class", "tooltip tooltip-primary tooltip-right");
    			attr_dev(div4, "data-tip", "Full serial number of computer");
    			add_location(div4, file, 94, 8, 3115);
    			attr_dev(label2, "class", "label");
    			attr_dev(label2, "for", "serial");
    			add_location(label2, file, 93, 6, 3071);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Type here");
    			attr_dev(input0, "class", "input input-bordered w-full max-w-xs");
    			add_location(input0, file, 101, 6, 3330);
    			attr_dev(div5, "class", "form-control w-full max-w-xs");
    			add_location(div5, file, 92, 4, 3021);
    			attr_dev(span3, "class", "label-text");
    			add_location(span3, file, 110, 6, 3544);
    			attr_dev(span4, "class", "label-text");
    			add_location(span4, file, 116, 10, 3765);
    			attr_dev(div6, "class", "tooltip tooltip-primary tooltip-right");
    			attr_dev(div6, "data-tip", "Standard (AFSOC)");
    			add_location(div6, file, 112, 8, 3642);
    			attr_dev(input1, "type", "radio");
    			attr_dev(input1, "name", "radio-6");
    			attr_dev(input1, "class", "radio");
    			input1.__value = 1;
    			input1.value = input1.__value;
    			input1.checked = true;
    			/*$$binding_groups*/ ctx[14][0].push(input1);
    			add_location(input1, file, 118, 8, 3826);
    			attr_dev(label3, "class", "label cursor-pointer");
    			add_location(label3, file, 111, 6, 3596);
    			attr_dev(div7, "class", "form-control mt-4");
    			add_location(div7, file, 109, 4, 3505);
    			attr_dev(span5, "class", "label-text");
    			add_location(span5, file, 131, 10, 4188);
    			attr_dev(div8, "class", "tooltip tooltip-primary tooltip-right");
    			attr_dev(div8, "data-tip", "EITaaS");
    			add_location(div8, file, 130, 8, 4107);
    			attr_dev(input2, "type", "radio");
    			attr_dev(input2, "name", "radio-6");
    			attr_dev(input2, "class", "radio");
    			input2.__value = 2;
    			input2.value = input2.__value;
    			/*$$binding_groups*/ ctx[14][0].push(input2);
    			add_location(input2, file, 133, 8, 4249);
    			attr_dev(label4, "class", "label cursor-pointer");
    			add_location(label4, file, 129, 6, 4061);
    			attr_dev(div9, "class", "form-control");
    			add_location(div9, file, 128, 4, 4027);
    			attr_dev(div10, "class", "card-body");
    			add_location(div10, file, 57, 2, 1931);
    			attr_dev(div11, "class", "mt-6 card w-96 bg-base-200 shadow-xl mx-auto");
    			add_location(div11, file, 56, 0, 1869);
    			attr_dev(div12, "class", "");
    			add_location(div12, file, 148, 6, 4561);
    			attr_dev(div13, "class", "text-2xl font-bold mx-auto");
    			add_location(div13, file, 149, 6, 4594);
    			attr_dev(div14, "class", "bg-base-200 rounded-2xl shadow-xl p-5");
    			add_location(div14, file, 147, 4, 4502);
    			attr_dev(div15, "class", "mt-10");
    			add_location(div15, file, 146, 2, 4477);
    			attr_dev(div16, "class", "mx-auto w-96");
    			add_location(div16, file, 145, 0, 4447);
    			attr_dev(label5, "for", "my-modal-4");
    			attr_dev(label5, "class", "btn btn-primary modal-button shadow-lg");
    			add_location(label5, file, 154, 2, 4734);
    			attr_dev(div17, "class", "mx-auto w-max mt-10");
    			add_location(div17, file, 153, 0, 4697);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "id", "my-modal-4");
    			attr_dev(input3, "class", "modal-toggle");
    			add_location(input3, file, 160, 0, 4900);
    			attr_dev(h3, "class", "text-lg font-bold");
    			add_location(h3, file, 163, 4, 5068);
    			attr_dev(p0, "class", "py-4");
    			add_location(p0, file, 164, 4, 5137);
    			add_location(b0, file, 165, 4, 5197);
    			add_location(p1, file, 166, 4, 5221);
    			add_location(b1, file, 167, 4, 5257);
    			add_location(p2, file, 168, 4, 5284);
    			add_location(b2, file, 169, 4, 5342);
    			add_location(p3, file, 170, 4, 5364);
    			add_location(b3, file, 171, 4, 5439);
    			add_location(p4, file, 172, 4, 5459);
    			attr_dev(label6, "class", "modal-box relative");
    			attr_dev(label6, "for", "");
    			add_location(label6, file, 162, 2, 5021);
    			attr_dev(label7, "for", "my-modal-4");
    			attr_dev(label7, "class", "modal cursor-pointer");
    			add_location(label7, file, 161, 0, 4964);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div11, anchor);
    			append_dev(div11, div10);
    			append_dev(div10, div1);
    			append_dev(div1, label0);
    			append_dev(label0, div0);
    			append_dev(div0, span0);
    			append_dev(div1, t3);
    			append_dev(div1, select0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(select0, null);
    			}

    			select_option(select0, /*selectedType*/ ctx[1]);
    			append_dev(div10, t4);
    			append_dev(div10, div3);
    			append_dev(div3, label1);
    			append_dev(label1, div2);
    			append_dev(div2, span1);
    			append_dev(div3, t6);
    			append_dev(div3, select1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select1, null);
    			}

    			select_option(select1, /*selectedSQ*/ ctx[2]);
    			append_dev(div10, t7);
    			append_dev(div10, div5);
    			append_dev(div5, label2);
    			append_dev(label2, div4);
    			append_dev(div4, span2);
    			append_dev(div5, t9);
    			append_dev(div5, input0);
    			set_input_value(input0, /*serial*/ ctx[3]);
    			append_dev(div10, t10);
    			append_dev(div10, div7);
    			append_dev(div7, span3);
    			append_dev(div7, t12);
    			append_dev(div7, label3);
    			append_dev(label3, div6);
    			append_dev(div6, span4);
    			append_dev(label3, t14);
    			append_dev(label3, input1);
    			input1.checked = input1.__value === /*image*/ ctx[0];
    			append_dev(div10, t15);
    			append_dev(div10, div9);
    			append_dev(div9, label4);
    			append_dev(label4, div8);
    			append_dev(div8, span5);
    			append_dev(label4, t17);
    			append_dev(label4, input2);
    			input2.checked = input2.__value === /*image*/ ctx[0];
    			insert_dev(target, t18, anchor);
    			insert_dev(target, div16, anchor);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div12);
    			append_dev(div14, t20);
    			append_dev(div14, div13);
    			append_dev(div13, t21);
    			insert_dev(target, t22, anchor);
    			insert_dev(target, div17, anchor);
    			append_dev(div17, label5);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, input3, anchor);
    			insert_dev(target, t25, anchor);
    			insert_dev(target, label7, anchor);
    			append_dev(label7, label6);
    			append_dev(label6, h3);
    			append_dev(label6, t27);
    			append_dev(label6, p0);
    			append_dev(label6, t29);
    			append_dev(label6, b0);
    			append_dev(label6, t31);
    			append_dev(label6, p1);
    			append_dev(label6, t33);
    			append_dev(label6, b1);
    			append_dev(label6, t35);
    			append_dev(label6, p2);
    			append_dev(label6, t37);
    			append_dev(label6, b2);
    			append_dev(label6, t39);
    			append_dev(label6, p3);
    			append_dev(label6, t41);
    			append_dev(label6, b3);
    			append_dev(label6, t43);
    			append_dev(label6, p4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[10]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[11]),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[12]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[13]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[15])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*computerTypes*/ 32) {
    				each_value_1 = /*computerTypes*/ ctx[5];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(select0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*selectedType, computerTypes*/ 34) {
    				select_option(select0, /*selectedType*/ ctx[1]);
    			}

    			if (dirty & /*squadrons*/ 64) {
    				each_value = /*squadrons*/ ctx[6];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*selectedSQ, squadrons*/ 68) {
    				select_option(select1, /*selectedSQ*/ ctx[2]);
    			}

    			if (dirty & /*serial*/ 8 && input0.value !== /*serial*/ ctx[3]) {
    				set_input_value(input0, /*serial*/ ctx[3]);
    			}

    			if (dirty & /*image*/ 1) {
    				input1.checked = input1.__value === /*image*/ ctx[0];
    			}

    			if (dirty & /*image*/ 1) {
    				input2.checked = input2.__value === /*image*/ ctx[0];
    			}

    			if (dirty & /*finalName*/ 16 && t21_value !== (t21_value = /*finalName*/ ctx[4].toUpperCase() + "")) set_data_dev(t21, t21_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div11);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			/*$$binding_groups*/ ctx[14][0].splice(/*$$binding_groups*/ ctx[14][0].indexOf(input1), 1);
    			/*$$binding_groups*/ ctx[14][0].splice(/*$$binding_groups*/ ctx[14][0].indexOf(input2), 1);
    			if (detaching) detach_dev(t18);
    			if (detaching) detach_dev(div16);
    			if (detaching) detach_dev(t22);
    			if (detaching) detach_dev(div17);
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(input3);
    			if (detaching) detach_dev(t25);
    			if (detaching) detach_dev(label7);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let name;
    	let sdc;
    	let edc;
    	let finalName;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Naming', slots, []);

    	const computerTypes = [
    		{ id: "W", type: "Workstation" },
    		{ id: "L", type: "Laptop" },
    		{ id: "T", type: "Tablet" }
    	];

    	const squadrons = [
    		{ id: "SOG", name: "27 SOG" },
    		{ id: "3OS", name: "3 SOS" },
    		{ id: "9OS", name: "9 SOS" },
    		{ id: "12OS", name: "12 SOS" },
    		{ id: "16OS", name: "16 SOS" },
    		{ id: "17OS", name: "17 SOS" },
    		{ id: "20OS", name: "20 SOS" },
    		{ id: "33OS", name: "33 SOS" },
    		{ id: "56IS", name: "56 SOIS" },
    		{ id: "310OS", name: "310 SOS" },
    		{ id: "318OS", name: "318 SOS" },
    		{ id: "OSS", name: "27 SOSS" },
    		{ id: "AMXS", name: "27 SOAMXS" },
    		{ id: "9AMU", name: "9 AMU" },
    		{ id: "16AMU", name: "16 AMU" },
    		{ id: "727MX", name: "727 SOAMXS" },
    		{ id: "3AMU", name: "3 AMU" },
    		{ id: "20AMU", name: "20 AMU" },
    		{ id: "MXG", name: "27 SOMXG" },
    		{ id: "MUNS", name: "27 SOMS" },
    		{ id: "SOW", name: "27 SOW" },
    		{ id: "AOS", name: "27 SOAOS" },
    		{ id: "CPTS", name: "27 SOCPTS" },
    		{ id: "MSG", name: "27 SOMSG" },
    		{ id: "CES", name: "27 SOCES" },
    		{ id: "CS", name: "27 SOCS" },
    		{ id: "LRS", name: "27 SOLRS" },
    		{ id: "CONS", name: "27 SOCONS" },
    		{ id: "SFS", name: "27 SOSFS" },
    		{ id: "FSS", name: "27 SOFSS" },
    		{ id: "STS", name: "26 STS" },
    		{ id: "43IS", name: "43 IS" },
    		{ id: "TRS", name: "373 TRS" }
    	];

    	let image = 1;
    	let selectedType;
    	let selectedSQ;
    	let serial = "";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Naming> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function select0_change_handler() {
    		selectedType = select_value(this);
    		$$invalidate(1, selectedType);
    		$$invalidate(5, computerTypes);
    	}

    	function select1_change_handler() {
    		selectedSQ = select_value(this);
    		$$invalidate(2, selectedSQ);
    		$$invalidate(6, squadrons);
    	}

    	function input0_input_handler() {
    		serial = this.value;
    		$$invalidate(3, serial);
    	}

    	function input1_change_handler() {
    		image = this.__value;
    		$$invalidate(0, image);
    	}

    	function input2_change_handler() {
    		image = this.__value;
    		$$invalidate(0, image);
    	}

    	$$self.$capture_state = () => ({
    		computerTypes,
    		squadrons,
    		image,
    		selectedType,
    		selectedSQ,
    		serial,
    		edc,
    		sdc,
    		name,
    		finalName
    	});

    	$$self.$inject_state = $$props => {
    		if ('image' in $$props) $$invalidate(0, image = $$props.image);
    		if ('selectedType' in $$props) $$invalidate(1, selectedType = $$props.selectedType);
    		if ('selectedSQ' in $$props) $$invalidate(2, selectedSQ = $$props.selectedSQ);
    		if ('serial' in $$props) $$invalidate(3, serial = $$props.serial);
    		if ('edc' in $$props) $$invalidate(7, edc = $$props.edc);
    		if ('sdc' in $$props) $$invalidate(8, sdc = $$props.sdc);
    		if ('name' in $$props) $$invalidate(9, name = $$props.name);
    		if ('finalName' in $$props) $$invalidate(4, finalName = $$props.finalName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selectedType, selectedSQ*/ 6) {
    			$$invalidate(9, name = `CZQZ${selectedType || ""}-${selectedSQ}`);
    		}

    		if ($$self.$$.dirty & /*serial, name*/ 520) {
    			$$invalidate(8, sdc = serial.substring(serial.length - (15 - name.length), serial.length));
    		}

    		if ($$self.$$.dirty & /*serial, name*/ 520) {
    			$$invalidate(7, edc = serial.substring(0, Math.min(serial.length, 15 - name.length)));
    		}

    		if ($$self.$$.dirty & /*name, image, sdc, edc*/ 897) {
    			$$invalidate(4, finalName = `${name}${image === 1 ? sdc : edc}`);
    		}
    	};

    	return [
    		image,
    		selectedType,
    		selectedSQ,
    		serial,
    		finalName,
    		computerTypes,
    		squadrons,
    		edc,
    		sdc,
    		name,
    		select0_change_handler,
    		select1_change_handler,
    		input0_input_handler,
    		input1_change_handler,
    		$$binding_groups,
    		input2_change_handler
    	];
    }

    class Naming extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Naming",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.4 */

    function create_fragment(ctx) {
    	let naming;
    	let current;
    	naming = new Naming({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(naming.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(naming, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(naming.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(naming.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(naming, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Naming });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z = "/*\n! tailwindcss v3.0.23 | MIT License | https://tailwindcss.com\n*//*\n1. Prevent padding and border from affecting element width. (https://github.com/mozdevs/cssremedy/issues/4)\n2. Allow adding a border to an element by just adding a border-width. (https://github.com/tailwindcss/tailwindcss/pull/116)\n*/\n\n*,\n::before,\n::after {\n  box-sizing: border-box; /* 1 */\n  border-width: 0; /* 2 */\n  border-style: solid; /* 2 */\n  border-color: #e5e7eb; /* 2 */\n}\n\n::before,\n::after {\n  --tw-content: '';\n}\n\n/*\n1. Use a consistent sensible line-height in all browsers.\n2. Prevent adjustments of font size after orientation changes in iOS.\n3. Use a more readable tab size.\n4. Use the user's configured `sans` font-family by default.\n*/\n\nhtml {\n  line-height: 1.5; /* 1 */\n  -webkit-text-size-adjust: 100%; /* 2 */\n  -moz-tab-size: 4; /* 3 */\n  -o-tab-size: 4;\n     tab-size: 4; /* 3 */\n  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"; /* 4 */\n}\n\n/*\n1. Remove the margin in all browsers.\n2. Inherit line-height from `html` so users can set them as a class directly on the `html` element.\n*/\n\nbody {\n  margin: 0; /* 1 */\n  line-height: inherit; /* 2 */\n}\n\n/*\n1. Add the correct height in Firefox.\n2. Correct the inheritance of border color in Firefox. (https://bugzilla.mozilla.org/show_bug.cgi?id=190655)\n3. Ensure horizontal rules are visible by default.\n*/\n\nhr {\n  height: 0; /* 1 */\n  color: inherit; /* 2 */\n  border-top-width: 1px; /* 3 */\n}\n\n/*\nAdd the correct text decoration in Chrome, Edge, and Safari.\n*/\n\nabbr:where([title]) {\n  -webkit-text-decoration: underline dotted;\n          text-decoration: underline dotted;\n}\n\n/*\nRemove the default font size and weight for headings.\n*/\n\nh1,\nh2,\nh3,\nh4,\nh5,\nh6 {\n  font-size: inherit;\n  font-weight: inherit;\n}\n\n/*\nReset links to optimize for opt-in styling instead of opt-out.\n*/\n\na {\n  color: inherit;\n  text-decoration: inherit;\n}\n\n/*\nAdd the correct font weight in Edge and Safari.\n*/\n\nb,\nstrong {\n  font-weight: bolder;\n}\n\n/*\n1. Use the user's configured `mono` font family by default.\n2. Correct the odd `em` font sizing in all browsers.\n*/\n\ncode,\nkbd,\nsamp,\npre {\n  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace; /* 1 */\n  font-size: 1em; /* 2 */\n}\n\n/*\nAdd the correct font size in all browsers.\n*/\n\nsmall {\n  font-size: 80%;\n}\n\n/*\nPrevent `sub` and `sup` elements from affecting the line height in all browsers.\n*/\n\nsub,\nsup {\n  font-size: 75%;\n  line-height: 0;\n  position: relative;\n  vertical-align: baseline;\n}\n\nsub {\n  bottom: -0.25em;\n}\n\nsup {\n  top: -0.5em;\n}\n\n/*\n1. Remove text indentation from table contents in Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=999088, https://bugs.webkit.org/show_bug.cgi?id=201297)\n2. Correct table border color inheritance in all Chrome and Safari. (https://bugs.chromium.org/p/chromium/issues/detail?id=935729, https://bugs.webkit.org/show_bug.cgi?id=195016)\n3. Remove gaps between table borders by default.\n*/\n\ntable {\n  text-indent: 0; /* 1 */\n  border-color: inherit; /* 2 */\n  border-collapse: collapse; /* 3 */\n}\n\n/*\n1. Change the font styles in all browsers.\n2. Remove the margin in Firefox and Safari.\n3. Remove default padding in all browsers.\n*/\n\nbutton,\ninput,\noptgroup,\nselect,\ntextarea {\n  font-family: inherit; /* 1 */\n  font-size: 100%; /* 1 */\n  line-height: inherit; /* 1 */\n  color: inherit; /* 1 */\n  margin: 0; /* 2 */\n  padding: 0; /* 3 */\n}\n\n/*\nRemove the inheritance of text transform in Edge and Firefox.\n*/\n\nbutton,\nselect {\n  text-transform: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Remove default button styles.\n*/\n\nbutton,\n[type='button'],\n[type='reset'],\n[type='submit'] {\n  -webkit-appearance: button; /* 1 */\n  background-color: transparent; /* 2 */\n  background-image: none; /* 2 */\n}\n\n/*\nUse the modern Firefox focus style for all focusable elements.\n*/\n\n:-moz-focusring {\n  outline: auto;\n}\n\n/*\nRemove the additional `:invalid` styles in Firefox. (https://github.com/mozilla/gecko-dev/blob/2f9eacd9d3d995c937b4251a5557d95d494c9be1/layout/style/res/forms.css#L728-L737)\n*/\n\n:-moz-ui-invalid {\n  box-shadow: none;\n}\n\n/*\nAdd the correct vertical alignment in Chrome and Firefox.\n*/\n\nprogress {\n  vertical-align: baseline;\n}\n\n/*\nCorrect the cursor style of increment and decrement buttons in Safari.\n*/\n\n::-webkit-inner-spin-button,\n::-webkit-outer-spin-button {\n  height: auto;\n}\n\n/*\n1. Correct the odd appearance in Chrome and Safari.\n2. Correct the outline style in Safari.\n*/\n\n[type='search'] {\n  -webkit-appearance: textfield; /* 1 */\n  outline-offset: -2px; /* 2 */\n}\n\n/*\nRemove the inner padding in Chrome and Safari on macOS.\n*/\n\n::-webkit-search-decoration {\n  -webkit-appearance: none;\n}\n\n/*\n1. Correct the inability to style clickable types in iOS and Safari.\n2. Change font properties to `inherit` in Safari.\n*/\n\n::-webkit-file-upload-button {\n  -webkit-appearance: button; /* 1 */\n  font: inherit; /* 2 */\n}\n\n/*\nAdd the correct display in Chrome and Safari.\n*/\n\nsummary {\n  display: list-item;\n}\n\n/*\nRemoves the default spacing and border for appropriate elements.\n*/\n\nblockquote,\ndl,\ndd,\nh1,\nh2,\nh3,\nh4,\nh5,\nh6,\nhr,\nfigure,\np,\npre {\n  margin: 0;\n}\n\nfieldset {\n  margin: 0;\n  padding: 0;\n}\n\nlegend {\n  padding: 0;\n}\n\nol,\nul,\nmenu {\n  list-style: none;\n  margin: 0;\n  padding: 0;\n}\n\n/*\nPrevent resizing textareas horizontally by default.\n*/\n\ntextarea {\n  resize: vertical;\n}\n\n/*\n1. Reset the default placeholder opacity in Firefox. (https://github.com/tailwindlabs/tailwindcss/issues/3300)\n2. Set the default placeholder color to the user's configured gray 400 color.\n*/\n\ninput::-moz-placeholder, textarea::-moz-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput:-ms-input-placeholder, textarea:-ms-input-placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\ninput::placeholder,\ntextarea::placeholder {\n  opacity: 1; /* 1 */\n  color: #9ca3af; /* 2 */\n}\n\n/*\nSet the default cursor for buttons.\n*/\n\nbutton,\n[role=\"button\"] {\n  cursor: pointer;\n}\n\n/*\nMake sure disabled buttons don't get the pointer cursor.\n*/\n:disabled {\n  cursor: default;\n}\n\n/*\n1. Make replaced elements `display: block` by default. (https://github.com/mozdevs/cssremedy/issues/14)\n2. Add `vertical-align: middle` to align replaced elements more sensibly by default. (https://github.com/jensimmons/cssremedy/issues/14#issuecomment-634934210)\n   This can trigger a poorly considered lint error in some tools but is included by design.\n*/\n\nimg,\nsvg,\nvideo,\ncanvas,\naudio,\niframe,\nembed,\nobject {\n  display: block; /* 1 */\n  vertical-align: middle; /* 2 */\n}\n\n/*\nConstrain images and videos to the parent width and preserve their intrinsic aspect ratio. (https://github.com/mozdevs/cssremedy/issues/14)\n*/\n\nimg,\nvideo {\n  max-width: 100%;\n  height: auto;\n}\n\n/*\nEnsure the default browser behavior of the `hidden` attribute.\n*/\n\n[hidden] {\n  display: none;\n}\n\n:root,\n[data-theme] {\n  background-color: hsla(var(--b1) / var(--tw-bg-opacity, 1));\n  color: hsla(var(--bc) / var(--tw-text-opacity, 1));\n}\n\nhtml {\n  -webkit-tap-highlight-color: transparent;\n}\n\n:root {\n  --p: 183 47% 59%;\n  --pf: 183 47% 47%;\n  --sf: 338 71% 62%;\n  --af: 39 84% 46%;\n  --nf: 280 46% 11%;\n  --in: 198 93% 60%;\n  --su: 158 64% 52%;\n  --wa: 43 96% 56%;\n  --er: 0 91% 71%;\n  --pc: 183 100% 12%;\n  --sc: 338 100% 16%;\n  --ac: 39 100% 12%;\n  --nc: 280 83% 83%;\n  --inc: 198 100% 12%;\n  --suc: 158 100% 10%;\n  --wac: 43 100% 11%;\n  --erc: 0 100% 14%;\n  --rounded-box: 1rem;\n  --rounded-badge: 1.9rem;\n  --animation-btn: 0.25s;\n  --animation-input: .2s;\n  --btn-text-case: uppercase;\n  --btn-focus-scale: 0.95;\n  --border-btn: 1px;\n  --s: 338 71% 78%;\n  --a: 39 84% 58%;\n  --n: 280 46% 14%;\n  --b1: 24 33% 97%;\n  --b2: 27 22% 92%;\n  --b3: 22 14% 89%;\n  --bc: 280 46% 14%;\n  --rounded-btn: 1.9rem;\n  --tab-border: 2px;\n  --tab-radius: .5rem;\n}\n\n*, ::before, ::after {\n  --tw-translate-x: 0;\n  --tw-translate-y: 0;\n  --tw-rotate: 0;\n  --tw-skew-x: 0;\n  --tw-skew-y: 0;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  --tw-pan-x:  ;\n  --tw-pan-y:  ;\n  --tw-pinch-zoom:  ;\n  --tw-scroll-snap-strictness: proximity;\n  --tw-ordinal:  ;\n  --tw-slashed-zero:  ;\n  --tw-numeric-figure:  ;\n  --tw-numeric-spacing:  ;\n  --tw-numeric-fraction:  ;\n  --tw-ring-inset:  ;\n  --tw-ring-offset-width: 0px;\n  --tw-ring-offset-color: #fff;\n  --tw-ring-color: rgb(59 130 246 / 0.5);\n  --tw-ring-offset-shadow: 0 0 #0000;\n  --tw-ring-shadow: 0 0 #0000;\n  --tw-shadow: 0 0 #0000;\n  --tw-shadow-colored: 0 0 #0000;\n  --tw-blur:  ;\n  --tw-brightness:  ;\n  --tw-contrast:  ;\n  --tw-grayscale:  ;\n  --tw-hue-rotate:  ;\n  --tw-invert:  ;\n  --tw-saturate:  ;\n  --tw-sepia:  ;\n  --tw-drop-shadow:  ;\n  --tw-backdrop-blur:  ;\n  --tw-backdrop-brightness:  ;\n  --tw-backdrop-contrast:  ;\n  --tw-backdrop-grayscale:  ;\n  --tw-backdrop-hue-rotate:  ;\n  --tw-backdrop-invert:  ;\n  --tw-backdrop-opacity:  ;\n  --tw-backdrop-saturate:  ;\n  --tw-backdrop-sepia:  ;\n}\n.avatar.placeholder > div {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.btn {\n  display: inline-flex;\n  flex-shrink: 0;\n  cursor: pointer;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n   -ms-user-select: none;\n       user-select: none;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: center;\n  border-color: transparent;\n  border-color: hsl(var(--n) / var(--tw-border-opacity));\n  text-align: center;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: var(--rounded-btn, 0.5rem);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 1em;\n  min-height: 3rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  text-transform: var(--btn-text-case, uppercase);\n  border-width: var(--border-btn, 1px);\n  -webkit-animation: button-pop var(--animation-btn, 0.25s) ease-out;\n          animation: button-pop var(--animation-btn, 0.25s) ease-out;\n  --tw-border-opacity: 1;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\n.btn-disabled, .btn[disabled] {\n  pointer-events: none;\n  --tw-border-opacity: 0;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.2;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n  --tw-text-opacity: 0.2;\n}\n.btn.loading, .btn.loading:hover {\n  pointer-events: none;\n}\n.btn.loading:before {\n  margin-right: 0.5rem;\n  height: 1rem;\n  width: 1rem;\n  border-radius: 9999px;\n  border-width: 2px;\n  -webkit-animation: spin 2s linear infinite;\n          animation: spin 2s linear infinite;\n  content: \"\";\n  border-top-color: transparent;\n  border-left-color: transparent;\n  border-bottom-color: currentColor;\n  border-right-color: currentColor;\n}\n@media (prefers-reduced-motion: reduce) {\n\n  .btn.loading:before {\n    -webkit-animation: spin 10s linear infinite;\n            animation: spin 10s linear infinite;\n  }\n}\n@-webkit-keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\n@keyframes spin {\n\n  from {\n    transform: rotate(0deg);\n  }\n\n  to {\n    transform: rotate(360deg);\n  }\n}\n.btn-group > input[type=\"radio\"].btn {\n  -webkit-appearance: none;\n  -moz-appearance: none;\n       appearance: none;\n}\n.btn-group > input[type=\"radio\"].btn:before {\n  content: attr(data-title);\n}\n.card {\n  position: relative;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  border-radius: var(--rounded-box, 1rem);\n}\n.card:focus {\n  outline: 2px solid transparent;\n  outline-offset: 2px;\n}\n.card-body {\n  display: flex;\n  flex: 1 1 auto;\n  flex-direction: column;\n  padding: var(--padding-card, 2rem);\n  gap: 0.5rem;\n}\n.card-body :where(p) {\n  flex-grow: 1;\n}\n.card figure {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n}\n.card.image-full {\n  display: grid;\n}\n.card.image-full:before {\n  position: relative;\n  content: \"\";\n  z-index: 10;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--n) / var(--tw-bg-opacity));\n  opacity: 0.75;\n  border-radius: var(--rounded-box, 1rem);\n}\n.card.image-full:before, .card.image-full > * {\n  grid-column-start: 1;\n  grid-row-start: 1;\n}\n.card.image-full > figure img {\n  height: 100%;\n  -o-object-fit: cover;\n     object-fit: cover;\n}\n.card.image-full > .card-body {\n  position: relative;\n  z-index: 20;\n  --tw-text-opacity: 1;\n  color: hsl(var(--nc) / var(--tw-text-opacity));\n}\n.checkbox {\n  flex-shrink: 0;\n  --chkbg: var(--bc);\n  --chkfg: var(--b1);\n  height: 1.5rem;\n  width: 1.5rem;\n  cursor: pointer;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n       appearance: none;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.2;\n  border-radius: var(--rounded-btn, 0.5rem);\n}\n.form-control {\n  display: flex;\n  flex-direction: column;\n}\n.label {\n  display: flex;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n   -ms-user-select: none;\n       user-select: none;\n  align-items: center;\n  justify-content: space-between;\n  padding-left: 0.25rem;\n  padding-right: 0.25rem;\n  padding-top: 0.5rem;\n  padding-bottom: 0.5rem;\n}\n.input {\n  flex-shrink: 1;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 2;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  border-radius: var(--rounded-btn, 0.5rem);\n}\n.input-group > *, .input-group > .input {\n  border-radius: 0px;\n}\n.modal {\n  pointer-events: none;\n  visibility: hidden;\n  position: fixed;\n  top: 0px;\n  right: 0px;\n  bottom: 0px;\n  left: 0px;\n  display: flex;\n  justify-content: center;\n  opacity: 0;\n  z-index: 999;\n  background-color: hsl(var(--nf, var(--n)) / var(--tw-bg-opacity));\n  --tw-bg-opacity: 0.4;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  transition-property: transform, opacity;\n  overflow-y: hidden;\n  -ms-scroll-chaining: none;\n      overscroll-behavior: contain;\n}\n:where(.modal) {\n  align-items: center;\n}\n.modal-box {\n  max-height: calc(100vh - 5em);\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  padding: 1.5rem;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  width: 91.666667%;\n  max-width: 32rem;\n  --tw-scale-x: .9;\n  --tw-scale-y: .9;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  border-top-left-radius: var(--rounded-box, 1rem);\n  border-top-right-radius: var(--rounded-box, 1rem);\n  border-bottom-left-radius: var(--rounded-box, 1rem);\n  border-bottom-right-radius: var(--rounded-box, 1rem);\n  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);\n  overflow-y: auto;\n  -ms-scroll-chaining: none;\n      overscroll-behavior: contain;\n}\n.modal-open, .modal:target, .modal-toggle:checked + .modal {\n  pointer-events: auto;\n  visibility: visible;\n  opacity: 1;\n}\n.modal-toggle {\n  position: fixed;\n  height: 0px;\n  width: 0px;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n       appearance: none;\n  opacity: 0;\n}\n.radio {\n  flex-shrink: 0;\n  --chkbg: var(--bc);\n  height: 1.5rem;\n  width: 1.5rem;\n  cursor: pointer;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n       appearance: none;\n  border-radius: 9999px;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0.2;\n  transition: background, box-shadow var(--animation-input, 0.2s) ease-in-out;\n}\n.select {\n  display: inline-flex;\n  flex-shrink: 0;\n  cursor: pointer;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n   -ms-user-select: none;\n       user-select: none;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n       appearance: none;\n  height: 3rem;\n  padding-left: 1rem;\n  padding-right: 2.5rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  line-height: 2;\n  min-height: 3rem;\n  border-width: 1px;\n  border-color: hsl(var(--bc) / var(--tw-border-opacity));\n  --tw-border-opacity: 0;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b1) / var(--tw-bg-opacity));\n  font-weight: 600;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n  border-radius: var(--rounded-btn, 0.5rem);\n  background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);\n  background-position: calc(100% - 20px) calc(1px + 50%), calc(100% - 16px) calc(1px + 50%);\n  background-size: 4px 4px, 4px 4px;\n  background-repeat: no-repeat;\n}\n.select-disabled, .select[disabled] {\n  pointer-events: none;\n  cursor: not-allowed;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 0.2;\n}\n.tooltip {\n  position: relative;\n  display: inline-block;\n  --tooltip-offset: calc(100% + 1px + var(--tooltip-tail, 0px));\n  text-align: center;\n  --tooltip-tail: 3px;\n  --tooltip-color: hsl(var(--n));\n  --tooltip-text-color: hsl(var(--nc));\n  --tooltip-tail-offset: calc(100% + 1px - var(--tooltip-tail));\n}\n.tooltip:before {\n  position: absolute;\n  pointer-events: none;\n  content: attr(data-tip);\n  transform: translateX(-50%);\n  top: auto;\n  left: 50%;\n  right: auto;\n  bottom: var(--tooltip-offset);\n  max-width: 20rem;\n  border-radius: 0.25rem;\n  padding-left: 0.5rem;\n  padding-right: 0.5rem;\n  padding-top: 0.25rem;\n  padding-bottom: 0.25rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  background-color: var(--tooltip-color);\n  color: var(--tooltip-text-color);\n  width: -webkit-max-content;\n  width: -moz-max-content;\n  width: max-content;\n}\n.tooltip-right:before {\n  transform: translateY(-50%);\n  top: 50%;\n  left: var(--tooltip-offset);\n  right: auto;\n  bottom: auto;\n}\n.btn-outline.btn-primary .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\n.btn-outline.btn-primary .badge-outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  background-color: transparent;\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\n.btn-outline.btn-primary:hover .badge {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pc) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\n.btn-outline.btn-primary:hover .badge.outline {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pc) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\n.btn:active:hover,\n  .btn:active:focus {\n  -webkit-animation: none;\n          animation: none;\n  transform: scale(var(--btn-focus-scale, 0.95));\n}\n.btn:hover, .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--nf, var(--n)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--nf, var(--n)) / var(--tw-bg-opacity));\n}\n.btn:focus-visible {\n  outline: 2px solid hsl(var(--nf));\n  outline-offset: 2px;\n}\n.btn-primary {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\n.btn-primary:hover, .btn-primary.btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n}\n.btn-primary:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\n.btn.glass:hover,\n    .btn.glass.btn-active {\n  --glass-opacity: 25%;\n  --glass-border-opacity: 15%;\n}\n.btn.glass:focus-visible {\n  outline: 2px solid 0 0 2px currentColor;\n}\n.btn-outline.btn-primary {\n  --tw-text-opacity: 1;\n  color: hsl(var(--p) / var(--tw-text-opacity));\n}\n.btn-outline.btn-primary:hover {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--pf, var(--p)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--pf, var(--p)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\n.btn.loading.btn-square:before, .btn.loading.btn-circle:before {\n  margin-right: 0px;\n}\n.btn.loading.btn-xl:before, .btn.loading.btn-lg:before {\n  height: 1.25rem;\n  width: 1.25rem;\n}\n.btn.loading.btn-sm:before, .btn.loading.btn-xs:before {\n  height: 0.75rem;\n  width: 0.75rem;\n}\n.btn-group > input[type=\"radio\"]:checked.btn, .btn-group > .btn-active {\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--p) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--p) / var(--tw-bg-opacity));\n  --tw-text-opacity: 1;\n  color: hsl(var(--pc) / var(--tw-text-opacity));\n}\n.btn-group > input[type=\"radio\"]:checked.btn:focus-visible, .btn-group > .btn-active:focus-visible {\n  outline: 2px solid hsl(var(--p));\n}\n.btn-group > .btn:not(:first-of-type) {\n  margin-left: -1px;\n  border-top-left-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\n.btn-group > .btn:not(:last-of-type) {\n  border-top-right-radius: 0px;\n  border-bottom-right-radius: 0px;\n}\n@-webkit-keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\n@keyframes button-pop {\n\n  0% {\n    transform: scale(var(--btn-focus-scale, 0.95));\n  }\n\n  40% {\n    transform: scale(1.02);\n  }\n\n  100% {\n    transform: scale(1);\n  }\n}\n.card:focus-visible {\n  outline: 2px solid currentColor;\n  outline-offset: 2px;\n}\n.card.bordered {\n  border-width: 1px;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n}\n.card.compact .card-body {\n  padding: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\n.checkbox:focus-visible {\n  outline: 2px solid hsl(var(--bc));\n  outline-offset: 2px;\n}\n.checkbox:checked, .checkbox[checked=\"true\"] {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  background-repeat: no-repeat;\n  -webkit-animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n          animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n  background-image: linear-gradient(-45deg, transparent 65%, hsl(var(--chkbg)) 65.99%), linear-gradient(45deg, transparent 75%, hsl(var(--chkbg)) 75.99%), linear-gradient(-45deg, hsl(var(--chkbg)) 40%, transparent 40.99%), linear-gradient(45deg, hsl(var(--chkbg)) 30%, hsl(var(--chkfg)) 30.99%, hsl(var(--chkfg)) 40%, transparent 40.99%), linear-gradient(-45deg, hsl(var(--chkfg)) 50%, hsl(var(--chkbg)) 50.99%);\n}\n.checkbox:indeterminate {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  background-repeat: no-repeat;\n  -webkit-animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n          animation: checkmark var(--animation-input, 0.2s) ease-in-out;\n  background-image: linear-gradient(90deg, transparent 80%, hsl(var(--chkbg)) 80%), linear-gradient(-90deg, transparent 80%, hsl(var(--chkbg)) 80%), linear-gradient(0deg, hsl(var(--chkbg)) 43%, hsl(var(--chkfg)) 43%, hsl(var(--chkfg)) 57%, hsl(var(--chkbg)) 57%);\n}\n.checkbox:disabled {\n  cursor: not-allowed;\n  border-color: transparent;\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  opacity: 0.2;\n}\n@-webkit-keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\n@keyframes checkmark {\n\n  0% {\n    background-position-y: 5px;\n  }\n\n  50% {\n    background-position-y: -2px;\n  }\n\n  100% {\n    background-position-y: 0;\n  }\n}\nbody[dir=\"rtl\"] .checkbox {\n  --chkbg: var(--bc);\n  --chkfg: var(--b1);\n}\nbody[dir=\"rtl\"] .checkbox:checked,\n    body[dir=\"rtl\"] .checkbox[checked=\"true\"] {\n  background-image: linear-gradient(45deg, transparent 65%, hsl(var(--chkbg)) 65.99%), linear-gradient(-45deg, transparent 75%, hsl(var(--chkbg)) 75.99%), linear-gradient(45deg, hsl(var(--chkbg)) 40%, transparent 40.99%), linear-gradient(-45deg, hsl(var(--chkbg)) 30%, hsl(var(--chkfg)) 30.99%, hsl(var(--chkfg)) 40%, transparent 40.99%), linear-gradient(45deg, hsl(var(--chkfg)) 50%, hsl(var(--chkbg)) 50.99%);\n}\n.drawer-toggle:focus-visible ~ .drawer-content .drawer-button.btn-primary {\n  outline: 2px solid hsl(var(--p));\n}\n.label-text {\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\n.label a:hover {\n  --tw-text-opacity: 1;\n  color: hsl(var(--bc) / var(--tw-text-opacity));\n}\n.input-bordered {\n  --tw-border-opacity: 0.2;\n}\n.input:focus {\n  outline: 2px solid hsla(var(--bc) / 0.2);\n  outline-offset: 2px;\n}\n.input-disabled, .input[disabled] {\n  cursor: not-allowed;\n  --tw-border-opacity: 1;\n  border-color: hsl(var(--b2, var(--b1)) / var(--tw-border-opacity));\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n  --tw-text-opacity: 0.2;\n}\n.input-disabled::-moz-placeholder, .input[disabled]::-moz-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\n.input-disabled:-ms-input-placeholder, .input[disabled]:-ms-input-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\n.input-disabled::placeholder, .input[disabled]::placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\n.modal-open .modal-box, .modal-toggle:checked + .modal .modal-box, .modal:target .modal-box {\n  --tw-translate-y: 0px;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n}\n@-webkit-keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\n@keyframes progress-loading {\n\n  50% {\n    left: 107%;\n  }\n}\n.radio:focus-visible {\n  outline: 2px solid hsl(var(--bc));\n  outline-offset: 2px;\n}\n.radio:checked {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--bc) / var(--tw-bg-opacity));\n  -webkit-animation: radiomark var(--animation-input, 0.2s) ease-in-out;\n          animation: radiomark var(--animation-input, 0.2s) ease-in-out;\n  box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n}\n.radio:disabled {\n  cursor: not-allowed;\n  opacity: 0.2;\n}\n@-webkit-keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\n@keyframes radiomark {\n\n  0% {\n    box-shadow: 0 0 0 12px hsl(var(--b1)) inset, 0 0 0 12px hsl(var(--b1)) inset;\n  }\n\n  50% {\n    box-shadow: 0 0 0 3px hsl(var(--b1)) inset, 0 0 0 3px hsl(var(--b1)) inset;\n  }\n\n  100% {\n    box-shadow: 0 0 0 4px hsl(var(--b1)) inset, 0 0 0 4px hsl(var(--b1)) inset;\n  }\n}\n@-webkit-keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\n@keyframes rating-pop {\n\n  0% {\n    transform: translateY(-0.125em);\n  }\n\n  40% {\n    transform: translateY(-0.125em);\n  }\n\n  100% {\n    transform: translateY(0);\n  }\n}\n.select-bordered {\n  --tw-border-opacity: 0.2;\n}\n.select:focus {\n  outline: 2px solid hsla(var(--bc) / 0.2);\n  outline-offset: 2px;\n}\n.select-disabled::-moz-placeholder, .select[disabled]::-moz-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\n.select-disabled:-ms-input-placeholder, .select[disabled]:-ms-input-placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\n.select-disabled::placeholder, .select[disabled]::placeholder {\n  color: hsl(var(--bc) / var(--tw-placeholder-opacity));\n  --tw-placeholder-opacity: 0.2;\n}\n.select-multiple, .select[multiple], .select[size].select:not([size=\"1\"]) {\n  background-image: none;\n  padding-right: 1rem;\n}\n.tooltip:before, .tooltip:after {\n  opacity: 0;\n  transition-property: color, background-color, border-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\n  transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-text-decoration-color, -webkit-backdrop-filter;\n  transition-delay: 100ms;\n  transition-duration: 200ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n}\n.tooltip:after {\n  position: absolute;\n  content: \"\";\n  border-style: solid;\n  border-width: var(--tooltip-tail, 0);\n  width: 0;\n  height: 0;\n  display: block;\n  transform: translateX(-50%);\n  border-color: var(--tooltip-color) transparent transparent transparent;\n  top: auto;\n  left: 50%;\n  right: auto;\n  bottom: var(--tooltip-tail-offset);\n}\n.tooltip.tooltip-open:before, .tooltip.tooltip-open:after, .tooltip:hover:before, .tooltip:hover:after {\n  opacity: 1;\n  transition-delay: 75ms;\n}\n.tooltip-right:after {\n  transform: translateY(-50%);\n  border-color: transparent var(--tooltip-color) transparent transparent;\n  top: 50%;\n  left: calc(var(--tooltip-tail-offset) + 1px);\n  right: auto;\n  bottom: auto;\n}\n.tooltip-primary {\n  --tooltip-color: hsl(var(--p));\n  --tooltip-text-color: hsl(var(--pc));\n}\n.card-compact .card-body {\n  padding: 1rem;\n  font-size: 0.875rem;\n  line-height: 1.25rem;\n}\n.card-normal .card-body {\n  padding: var(--padding-card, 2rem);\n  font-size: 1rem;\n  line-height: 1.5rem;\n}\n.modal-bottom :where(.modal-box) {\n  width: 100%;\n  max-width: none;\n  --tw-translate-y: 2.5rem;\n  --tw-scale-x: 1;\n  --tw-scale-y: 1;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  border-bottom-right-radius: 0px;\n  border-bottom-left-radius: 0px;\n}\n.modal-middle :where(.modal-box) {\n  width: 91.666667%;\n  max-width: 32rem;\n  --tw-translate-y: 0px;\n  --tw-scale-x: .9;\n  --tw-scale-y: .9;\n  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n  border-bottom-left-radius: var(--rounded-box, 1rem);\n  border-bottom-right-radius: var(--rounded-box, 1rem);\n}\n.relative {\n  position: relative;\n}\n.mx-auto {\n  margin-left: auto;\n  margin-right: auto;\n}\n.mt-10 {\n  margin-top: 2.5rem;\n}\n.mt-6 {\n  margin-top: 1.5rem;\n}\n.mt-4 {\n  margin-top: 1rem;\n}\n.w-96 {\n  width: 24rem;\n}\n.w-full {\n  width: 100%;\n}\n.w-max {\n  width: -webkit-max-content;\n  width: -moz-max-content;\n  width: max-content;\n}\n.max-w-xs {\n  max-width: 20rem;\n}\n.cursor-pointer {\n  cursor: pointer;\n}\n.rounded-2xl {\n  border-radius: 1rem;\n}\n.bg-base-200 {\n  --tw-bg-opacity: 1;\n  background-color: hsl(var(--b2, var(--b1)) / var(--tw-bg-opacity));\n}\n.p-5 {\n  padding: 1.25rem;\n}\n.py-4 {\n  padding-top: 1rem;\n  padding-bottom: 1rem;\n}\n.text-center {\n  text-align: center;\n}\n.text-2xl {\n  font-size: 1.5rem;\n  line-height: 2rem;\n}\n.text-lg {\n  font-size: 1.125rem;\n  line-height: 1.75rem;\n}\n.font-bold {\n  font-weight: 700;\n}\n.shadow-xl {\n  --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);\n  --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\n.shadow-lg {\n  --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);\n  --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color);\n  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);\n}\n";
    styleInject(css_248z);

    const app = new App({
      target: document.body,
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
