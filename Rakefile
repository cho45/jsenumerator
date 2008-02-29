
require "rubygems"
require "rake"
require "rake/clean"
require "shipit"

CLEAN.include ["jsenumerator.{mini,nodoc}.js"]

RELEASES = %w(jsenumerator.mini.js jsenumerator.nodoc.js jsenumerator.js)
VERS     = File.read("jsenumerator.js")[/Version = "(\d+\.\d+\.\d+)"/, 1]

COPYRIGHT = <<EOS
JSEnumerator #{VERS} Copyright (c) 2008 KAYAC Inc. ( http://www.kayac.com/ )
http://coderepos.org/share/wiki/JSEnumerator
EOS

def mini(js, commentonly=false)
	js = js.dup
	js.gsub!(%r|\n?/\*.*?\*/|m, "")
	js.gsub!(%r|\n?\s*//.*|, "")
	js.gsub!(/\A\s+|\s+\z/, "")
	unless commentonly
		js.gsub!(/^\s+/, "")
		js.gsub!(/[ \t]+/, " ")
		js.gsub!(/\n\n+/, "\n")
		js.gsub!(/\s?;\s?/, ";")
		js.gsub!(/ ?([{}()<>:=,*\/+-]) ?/, "\\1")
	end
	COPYRIGHT.gsub(/^/, "// ") + js
end

task :default => [:test]

desc "Test JSDeferred"
task :test => RELEASES do
	sh %{rhino -opt 0 -w -strict test-rhino.js jsenumerator.js}
end

desc "Create all release files"
task :release => RELEASES

file "jsenumerator.mini.js" do
	cont = File.read("jsenumerator.js")
	File.open("jsenumerator.mini.js", "w") do |f|
		f.puts mini(cont)
	end
end

file "jsenumerator.nodoc.js" do
	cont = File.read("jsenumerator.js")
	File.open("jsenumerator.nodoc.js", "w") do |f|
		f.puts mini(cont, true)
	end
end

Rake::ShipitTask.new do |s|
	s.ChangeVersion "jsenumerator.js", "Version"
	s.Task :release
	s.Commit
	s.Tag
end

