/*global Float64Array */

var FFT = (function () {

	var	pi2	= Math.PI * 2,
		sin	= Math.sin,
		cos	= Math.cos;


	function factor (n) {
		var p = 4, v = Math.floor(Math.sqrt(n)), buffer = [];

		while (n > 1) {
			while (n % p) {
				switch (p) {
					case 4: p = 2; break;
					case 2: p = 3; break;
					default: p += 2; break;
				}

				if (p > v) {
					p = n;
				}
			}

			n /= p;

			buffer.push(p);
			buffer.push(n);
		}

		return buffer;
	}

	function allocate (n, inverse) {
		var	i, phase, t,
			state = {
				n: n,
				inverse: inverse,

				factors: factor(n),
				twiddle: new Float64Array(2 * n)
			};

		t = state.twiddle;

		for (i = 0; i < n; i++) {
			if (inverse) {
				phase =  pi2 * i / n;
			} else {
				phase = -pi2 * i / n;
			}

			t[2 * i + 0] = cos(phase);
			t[2 * i + 1] = sin(phase);
		}

		return state;
	}


	function butterfly2(output, outputOffset, fStride, state, m) {
		var t = state.twiddle;

		for (var i = 0; i < m; i++) {
			var v1_r = output[2 * (outputOffset + 0 + i) + 0] / 2.0;
			var v1_i = output[2 * (outputOffset + 0 + i) + 1] / 2.0;

			var v2_r = output[2 * (outputOffset + m + i) + 0] / 2.0;
			var v2_i = output[2 * (outputOffset + m + i) + 1] / 2.0;

			var t_r = v2_r * t[2 * fStride * i + 0] - v2_i * t[2 * fStride * i + 1];
			var t_i = v2_r * t[2 * fStride * i + 1] + v2_i * t[2 * fStride * i + 0];

			output[2 * (outputOffset + 0 + i) + 0] = v1_r + t_r;
			output[2 * (outputOffset + 0 + i) + 1] = v1_i + t_i;

			output[2 * (outputOffset + m + i) + 0] = v1_r - t_r;
			output[2 * (outputOffset + m + i) + 1] = v1_i - t_i;
		}
	}

	function butterfly3(output, outputOffset, fStride, state, m) {
		var t = state.twiddle;

		var e1_i = t[2 * fStride * m + 1];

		for (var i = 0; i < m; i++) {
			var v1_r = output[2 * (outputOffset + 0 * m + i) + 0] / 3.0;
			var v1_i = output[2 * (outputOffset + 0 * m + i) + 1] / 3.0;

			var v2_r = output[2 * (outputOffset + 1 * m + i) + 0] / 3.0;
			var v2_i = output[2 * (outputOffset + 1 * m + i) + 1] / 3.0;

			var v3_r = output[2 * (outputOffset + 2 * m + i) + 0] / 3.0;
			var v3_i = output[2 * (outputOffset + 2 * m + i) + 1] / 3.0;

			var t1_r = v2_r * t[2 * (1 * fStride) * i + 0] - v2_i * t[2 * (1 * fStride) * i + 1];
			var t1_i = v2_r * t[2 * (1 * fStride) * i + 1] + v2_i * t[2 * (1 * fStride) * i + 0];

			var t2_r = v3_r * t[2 * (2 * fStride) * i + 0] - v3_i * t[2 * (2 * fStride) * i + 1];
			var t2_i = v3_r * t[2 * (2 * fStride) * i + 1] + v3_i * t[2 * (2 * fStride) * i + 0];

			var t3_r = t1_r + t2_r;
			var t3_i = t1_i + t2_i;

			var t4_r = (t1_r - t2_r) * e1_i;
			var t4_i = (t1_i - t2_i) * e1_i;

			v2_r = v1_r - t3_r / 2.0;
			v2_i = v1_i - t3_i / 2.0;

			output[2 * (outputOffset + 0 * m + i) + 0] = v1_r + t3_r;
			output[2 * (outputOffset + 0 * m + i) + 1] = v1_i + t3_i;

			output[2 * (outputOffset + 1 * m + i) + 0] = v2_r - t4_i;
			output[2 * (outputOffset + 1 * m + i) + 1] = v2_i + t4_r;

			output[2 * (outputOffset + 2 * m + i) + 0] = v2_r + t4_i;
			output[2 * (outputOffset + 2 * m + i) + 1] = v2_i - t4_r;
		}
	}

	function butterfly4(output, outputOffset, fStride, state, m) {
		var t = state.twiddle;

		for (var i = 0; i < m; i++) {
			var v1_r = output[2 * (outputOffset + 0 * m + i) + 0] / 4.0;
			var v1_i = output[2 * (outputOffset + 0 * m + i) + 1] / 4.0;

			var v2_r = output[2 * (outputOffset + 1 * m + i) + 0] / 4.0;
			var v2_i = output[2 * (outputOffset + 1 * m + i) + 1] / 4.0;

			var v3_r = output[2 * (outputOffset + 2 * m + i) + 0] / 4.0;
			var v3_i = output[2 * (outputOffset + 2 * m + i) + 1] / 4.0;

			var v4_r = output[2 * (outputOffset + 3 * m + i) + 0] / 4.0;
			var v4_i = output[2 * (outputOffset + 3 * m + i) + 1] / 4.0;

			var t1_r = v2_r * t[2 * (1 * fStride) * i + 0] - v2_i * t[2 * (1 * fStride) * i + 1];
			var t1_i = v2_r * t[2 * (1 * fStride) * i + 1] + v2_i * t[2 * (1 * fStride) * i + 0];

			var t2_r = v3_r * t[2 * (2 * fStride) * i + 0] - v3_i * t[2 * (2 * fStride) * i + 1];
			var t2_i = v3_r * t[2 * (2 * fStride) * i + 1] + v3_i * t[2 * (2 * fStride) * i + 0];

			var t3_r = v4_r * t[2 * (3 * fStride) * i + 0] - v4_i * t[2 * (3 * fStride) * i + 1];
			var t3_i = v4_r * t[2 * (3 * fStride) * i + 1] + v4_i * t[2 * (3 * fStride) * i + 0];

			var t4_r = v1_r - t2_r;
			var t4_i = v1_i - t2_i;

			var t5_r = t1_r + t3_r;
			var t5_i = t1_i + t3_i;

			var t6_r = t1_r - t3_r;
			var t6_i = t1_i - t3_i;

			v1_r += t2_r;
			v1_i += t2_i;

			output[2 * (outputOffset + 0 * m + i) + 0] = v1_r + t5_r;
			output[2 * (outputOffset + 0 * m + i) + 1] = v1_i + t5_i;

			output[2 * (outputOffset + 2 * m + i) + 0] = v1_r - t5_r;
			output[2 * (outputOffset + 2 * m + i) + 1] = v1_i - t5_i;

			if (state.inverse) {
				output[2 * (outputOffset + 1 * m + i) + 0] = t4_r - t6_i;
				output[2 * (outputOffset + 1 * m + i) + 1] = t4_i + t6_r;

				output[2 * (outputOffset + 3 * m + i) + 0] = t4_r + t6_i;
				output[2 * (outputOffset + 3 * m + i) + 1] = t4_i - t6_r;
			} else {
				output[2 * (outputOffset + 1 * m + i) + 0] = t4_r + t6_i;
				output[2 * (outputOffset + 1 * m + i) + 1] = t4_i - t6_r;

				output[2 * (outputOffset + 3 * m + i) + 0] = t4_r - t6_i;
				output[2 * (outputOffset + 3 * m + i) + 1] = t4_i + t6_r;
			}
		}
	}

	function butterfly(output, outputOffset, fStride, state, m, p) {
		var	t	= state.twiddle,
			n	= state.n,
			scratch	= new Float64Array(2 * p),
			q, q1, u, k;

		for (u = 0; u < m; u++) {
			for (q1 = 0, k = u; q1 < p; q1++, k += m) {
				scratch[2 * q1 + 0] = output[2 * (outputOffset + k) + 0] / p;
				scratch[2 * q1 + 1] = output[2 * (outputOffset + k) + 1] / p;
			}

			for (q1 = 0, k = u; q1 < p; q1++, k += m) {
				var tOffset = 0;

				output[2 * (outputOffset + k) + 0] = scratch[0];
				output[2 * (outputOffset + k) + 1] = scratch[1];

				for (q = 1; q < p; q++) {
					tOffset = (tOffset + fStride * k) % n;

					var t_r = scratch[2 * q + 0] * t[2 * tOffset + 0] - scratch[2 * q + 1] * t[2 * tOffset + 1];
					var t_i = scratch[2 * q + 0] * t[2 * tOffset + 1] + scratch[2 * q + 1] * t[2 * tOffset + 0];

					output[2 * (outputOffset + k) + 0] += t_r;
					output[2 * (outputOffset + k) + 1] += t_i;
				}
			}
		}
	}

	function work(output, outputOffset, f, fOffset, fStride, inputStride, factors, state) {
		var	p = factors.shift(),
			m = factors.shift(),
			i;

		if (m === 1) {
			for (i = 0; i < p * m; i++) {
				output[2 * (outputOffset + i) + 0] = f[2 * (fOffset + i * fStride * inputStride) + 0];
				output[2 * (outputOffset + i) + 1] = f[2 * (fOffset + i * fStride * inputStride) + 1];
			}
		} else {
			for (i = 0; i < p; i++) {
				work(output, outputOffset + i * m, f, fOffset + i * fStride * inputStride, fStride * p, inputStride, factors.slice(), state);
			}
		}

		switch (p) {
			case 2: butterfly2(output, outputOffset, fStride, state, m); break;
			case 3: butterfly3(output, outputOffset, fStride, state, m); break;
			case 4: butterfly4(output, outputOffset, fStride, state, m); break;
			default: butterfly(output, outputOffset, fStride, state, m, p); break;
		}
	}

	function FFT (n, inverse) {
		this.state = allocate(n, inverse);
	}

	FFT.prototype.process = function(output, input, stride) {
		if (!stride) { stride = 1; }

		if (input === output) {
			var temp = new Float64Array(2 * this.state.n);

			work(temp, 0, input, 0, 1, stride, this.state.factors.slice(), this.state);

			output.set(temp);
		} else {
			work(output, 0, input, 0, 1, stride, this.state.factors.slice(), this.state);
		}
	};

	return FFT;
}());
