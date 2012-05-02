
require "rubygems"
require "rake"
require "rake/clean"
require 'pathname'

JSDOC = Pathname.new("~/app/jsdoc-toolkit").expand_path
RELEASES = %w(jsenumerator.js)
VERS     = File.read("jsenumerator.js")[/Version = "(\d+\.\d+\.\d+)"/, 1]

def test_doc
	require 'rubygems'
	require 'net/http'
	require 'json'

	uri = URI.parse('http://closure-compiler.appspot.com/compile')
	req = Net::HTTP::Post.new(uri.request_uri)
	req.set_form_data([
		['output_format'     , 'json'],
		['output_info'       , 'compiled_code'],
		['output_info'       , 'warnings'],
		['output_info'       , 'errors'],
		['compilation_level' , 'SIMPLE_OPTIMIZATIONS'],
		['warning_level'     , 'default'],
		['output_file_name'  , 'jsenumerator.js'],
		['js_code'           , File.read('./jsenumerator.js')],
	])

	res = Net::HTTP.start(uri.host, uri.port) {|http| http.request(req) }

	dat = JSON.parse(res.body)
	if dat['serverErrors']
		p dat['serverErrors']
		exit 1
	end

	puts 'http://closure-compiler.appspot.com' + dat['outputFilePath']
	code = dat['compiledCode']
	if dat['warnings']
		dat['warnings'].each do |m|
			puts "#{m['type']}: #{m['warning']}"
			puts "line: #{m['lineno']}, char: #{m['charno']}"
			puts m['line']
			puts
		end
	end
	if dat['errors']
		dat['errors'].each do |m|
			puts "#{m['type']}: #{m['error']}"
			puts "line: #{m['lineno']}, char: #{m['charno']}"
			puts m['line']
			puts
		end
	end
end

task :default => [:test]

desc "Test JSDeferred"
task :test => RELEASES do
	sh %{node ./test-node.js}
	test_doc
end

desc "Create all release files"
task :release => RELEASES

task :setupdb do
	unless JSDOC.exist?
		JSDOC.parent.mkpath
		Dir.chdir '/tmp' do
			sh %{wget http://jsdoc-toolkit.googlecode.com/files/jsdoc_toolkit-2.3.2.zip}
			sh %{unzip jsdoc_toolkit-2.3.2.zip}
			sh %{mv jsdoc_toolkit-2.3.2/jsdoc-toolkit #{JSDOC}}
		end
	end
end

desc "Create Documentation"
task :doc => ["doc/index.html"] do |t|
end

file "doc/index.html" => ["./jsenumerator.js", "doc/template/class.tmpl", "doc/template/publish.js"] do |t|
	if JSDOC.exist? && system('which java')
		sh %{java -jar #{JSDOC}/jsrun.jar #{JSDOC}/app/run.js -s -d=doc -t=doc/template ./jsenumerator.js}
	else
		warn "java is not installed or #{JSDOC} is not exists."
	end
end

